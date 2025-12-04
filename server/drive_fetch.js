export async function fetchFromDrive(fileId) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Drive-respons ej OK");
  return await res.text();
}