async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/db");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Returned Keys:", Object.keys(data));
    if (data.profiles) {
      console.log("Profiles count:", data.profiles.length);
      console.log("First profile:", data.profiles[0]);
    } else {
      console.log("No profiles key in returned data.");
    }
  } catch (err: any) {
    console.error("API Fetch Error:", err.message);
  }
}
test();
