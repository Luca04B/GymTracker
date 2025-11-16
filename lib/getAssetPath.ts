export function getAssetPath(path: string) {
  const prefix = process.env.NODE_ENV === "production" ? "/GymTracker" : "";
  return `${prefix}${path}`;
}
