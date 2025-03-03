
type VersionString = "OK" | "Partial";

export class VersionResult {
  version: string;
  status : VersionString;
  details : { database: string };
}