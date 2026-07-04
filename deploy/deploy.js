import { deploy, excludeDefaults } from "@samkirkland/ftp-deploy"
import { Command } from "commander"

const program = new Command();

program
    .requiredOption("-p, --password <password>", "FTP password")
    .requiredOption("-s, --source <source>", "Source directory to deploy (local one)")
    .requiredOption("-d, --destination <destination>", "Destination directory on the server (remote one)")
    .requiredOption("-h, --server <server>", "FTP server hostname")
    .requiredOption("-u, --username <username>", "FTP username");

program.parse(process.argv);

const options = program.opts();

async function deployCode() {
    console.log("Deploying...");
    await deploy({
        server: options.server,
        username: options.username,
        password: options.password,
        port: 21,
        protocol: "ftp",
        "local-dir": options.source,
        "server-dir": options.destination,
        exclude: [...excludeDefaults],
        timeout: 300000,
        "log-level": "info",
    });

    console.log("Deploy complete!");
}

deployCode();