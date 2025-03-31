
type ApiStatusString = "OK" | "Partial";
type DatabaseString = "OK" | "KO";

export class DatabaseStatus {
  status: DatabaseString
}

export class DatabaseVersion {
  version: string;
}

export class PingResult {
  status: ApiStatusString;
  database: { version: string, status: DatabaseString };
}