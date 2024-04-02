export type DatabaseSyncEnricherParameters = {
  // Relevant only within SQL query (for interpolation):
  fromTimestamp?: string
  toTimestamp?: string
}
