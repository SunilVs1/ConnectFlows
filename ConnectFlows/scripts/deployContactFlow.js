import { ConnectClient, CreateContactFlowCommand, UpdateContactFlowContentCommand, ListContactFlowsCommand } from "@aws-sdk/client-connect";
import fs from "fs";
import path from "path";

// Load the JSON contact flow
const flowPath = path.join(process.cwd(), "contact-flows", "Corp_Main_Sort2.json");
const flowContent = fs.readFileSync(flowPath, "utf8");

// Define the Amazon Connect instances
const instances = [
  {
    name: "lab",
    region: process.env.AWS_REGION || "us-east-1",
    instanceId: "564cf3da-4e5f-41b0-b2ca-a1113558c86f"
  },
  {
    name: "prod",
    region: process.env.AWS_REGION || "us-east-1",
    instanceId: "323e2539-cb2c-4535-aad2-74d091e0b3fd"
  }
];

async function deployToInstance(instance) {
  const client = new ConnectClient({ region: instance.region });

  console.log(`\nDeploying flow to ${instance.name} (${instance.region})...`);

  const listCmd = new ListContactFlowsCommand({ InstanceId: instance.instanceId });
  const list = await client.send(listCmd);

  const existingFlow = list.ContactFlowSummaryList.find(f => f.Name === "Corp_Main_Sort2");

  if (existingFlow) {
    console.log(`Updating existing flow: ${existingFlow.ContactFlowId}`);
    const updateCmd = new UpdateContactFlowContentCommand({
      InstanceId: instance.instanceId,
      ContactFlowId: existingFlow.ContactFlowId,
      Content: flowContent
    });
    await client.send(updateCmd);
    console.log("Flow updated successfully.");
  } else {
    console.log("Creating new contact flow...");
    const createCmd = new CreateContactFlowCommand({
      InstanceId: instance.instanceId,
      Name: "Corp_Main_Sort2",
      Type: "CONTACT_FLOW",
      Content: flowContent,
      Description: "Deployed via CI/CD"
    });
    await client.send(createCmd);
    console.log("Flow created successfully.");
  }
}

// Deploy to both instances
(async () => {
  for (const instance of instances) {
    await deployToInstance(instance);
  }
})();
