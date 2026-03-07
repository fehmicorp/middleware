import { Proxy } from "../src/index";

function createReq(method: string, url: string, headers: any = {}) {
  return {
    method,
    headers: new Headers(headers),
    nextUrl: new URL(url)
  };
}

async function runTest(name: string, req: any) {
  console.log("\n===============================");
  console.log("TEST:", name);
  console.log("===============================");

  const res = await Proxy.handle(req as any, "redis://dummy");

  console.log("Status:", res.status);

  console.log("Headers:");
  res.headers.forEach((v, k) => {
    console.log(`${k}: ${v}`);
  });

  console.log("Body:", res.body);
}

async function main() {

  await runTest(
    "POST route mapping",
    createReq("POST", "http://localhost/api/auth/login", {
      "x-key": "accounts"
    })
  );

  await runTest(
    "PUT route mapping",
    createReq("PUT", "http://localhost/api/auth/login", {
      "x-key": "accounts"
    })
  );

  await runTest(
    "PATCH route mapping",
    createReq("PATCH", "http://localhost/api/auth/login", {
      "x-key": "accounts"
    })
  );

  await runTest(
    "DELETE route mapping",
    createReq("DELETE", "http://localhost/api/auth/login", {
      "x-key": "accounts"
    })
  );

  await runTest(
    "GET auth verification",
    createReq("GET", "http://localhost/api/users", {
      Authorization: "Bearer testtoken"
    })
  );

  await runTest(
    "WS route mapping",
    createReq("WS", "http://localhost/ws/socket", {
      "x-key": "accounts"
    })
  );

}

main();