const { execSync } = require("child_process");
try {
  const result = execSync("npm run build", {
    cwd: "D:\\Users\\vowas\\Desktop\\ТЕСТОВЫЕ\\Saburova_Elena_Infotek_test\\frontend",
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  console.log(result);
} catch (error) {
  console.error("stdout:", error.stdout);
  console.error("stderr:", error.stderr);
  process.exit(1);
}
