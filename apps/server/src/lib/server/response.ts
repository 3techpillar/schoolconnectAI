export function jsonError(message: string, status = 400, extra?: object) {
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

export function jsonOk<T extends object>(data: T, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}
