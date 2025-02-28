
type VersionString = "OK" | "Partial";

export class VersionResult {
  status : VersionString;
  details : { database: string };
}