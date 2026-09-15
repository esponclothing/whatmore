import { sendWhatsAppTemplateAction } from '../src/app/actions/whatsAppPlatformActions';

async function main() {
  console.log('--- Testing sendWhatsAppTemplateAction with "test_catalog" ---');
  const res1 = await sendWhatsAppTemplateAction(
    "919812354321",
    "test_catalog",
    "en_US",
    [{ type: "body", parameters: [{ type: "text", text: "Espon" }] }]
  );
  console.log('Result 1 (test_catalog with body):', res1);

  console.log('\n--- Testing sendWhatsAppTemplateAction with "test_catalog" and empty components ---');
  const res2 = await sendWhatsAppTemplateAction(
    "919812354321",
    "test_catalog",
    "en_US",
    []
  );
  console.log('Result 2 (test_catalog with empty components):', res2);
}

main().catch(console.error);
