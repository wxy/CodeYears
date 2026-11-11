/** Only explicit complete creation-event coverage since registration can establish first.
 * Dates are already validated by the caller; camera state is deliberately absent. */
export function recognize(mapDates, evidence) {
  const dates=new Set(mapDates), tower=!!evidence.joined&&dates.has(evidence.joined);
  const ordered=[...new Set(evidence.created)].sort();
  const first=tower&&evidence.completeFromJoined&&ordered.length>0&&ordered[0]>=evidence.joined&&dates.has(ordered[0])?ordered[0]:undefined;
  return {tower,first,shared:!!first&&first===evidence.joined};
}
