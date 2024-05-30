import { database } from "flair-sdk";
// OPTIONAL: import { blockchain } from 'flair-sdk';
import { EventHandlerInput } from "flair-sdk";


export const processEvent = async (input: EventHandlerInput) => {
  const eventName = input.parsed?.name || input.abi?.eventName

  if (!eventName) {
    throw new Error(
      `Event name not found for log index ${input.log.logIndex} of ${input.txHash}`,
    )
  }

  const data = {
    // Unique ID for this entity.
    //
    // Some useful tips:
    // - chainId makes sure if potentially same tx has happened on different chains it will be stored separately.
    // - hash and logIndex make sure this event is stored uniquely.
    // - hash also makes sure with potential reorgs we don't store same event twice.
    // - logIndex also makes sure if such event has happened multiple times in same tx it will be stored separately.
    entityId: `${input.chainId}-${input.txHash}-${input.log.logIndex}`,

    // Horizon helps with chronological ordering of events and handling re-orgs
    // This will automatically add blockNumber and logIndex fields to the entity.
    horizon: input.horizon,

    // You can store any data you want, even every single entity of the same type can have different fields.
    chainId: input.chainId,
    contractAddress: input.log.address,
    blockTimestamp: input.blockTimestamp,
    txHash: input.txHash,
  }

  // All event args as-is
  const eventArgs = {
    ...input.parsed?.args,
  }

  // 1) Store the event in a separate entity type
  await database.upsert({
    entityType: eventName,
    ...data,
    ...eventArgs,
  })

  // 2) Also store the event in a generic entity type
  await database.upsert({
    entityType: 'Event',
    eventName,
    ...data,
    args: eventArgs,
  })
}
