export interface Logger { info(m: string, f?: object): void; warn(m: string, f?: object): void; error(m: string, f?: object): void }
const emit = (level: string, m: string, f: object = {}) => console.log(JSON.stringify({ t: new Date().toISOString(), level, m, ...f }));
export const logger: Logger = { info: (m, f) => emit("info", m, f), warn: (m, f) => emit("warn", m, f), error: (m, f) => emit("error", m, f) };
