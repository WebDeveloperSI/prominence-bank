import { createFileRoute } from "@tanstack/react-router";
import { AdminStub } from "@/components/banking/AdminStub";
import { Pill } from "@/components/banking/Stat";
export const Route = createFileRoute("/admin/customers")({ component: () => (
  <AdminStub eyebrow="CRM" title="Customers & KYC" intro="Search, segment and manage every relationship. Approve KYC tiers, place holds and review profiles."
    columns={["Customer","Tier","KYC","AUM","Status"]}
    rows={[
      ["A. Harrington","Tier I","Approved","$ 18.4M",<Pill key="1" tone="success">Active</Pill>],
      ["Aurora Capital LLC","Corporate","Approved","$ 42.1M",<Pill key="2" tone="success">Active</Pill>],
      ["Pacific Bullion Pte","Corporate","Pending","$ 8.2M",<Pill key="3" tone="warning">AML review</Pill>],
      ["Helvetia Maison SA","Corporate","Approved","$ 12.0M",<Pill key="4" tone="success">Active</Pill>],
      ["Nakamura Holdings","Tier II","Expired","$ 3.4M",<Pill key="5" tone="danger">Hold</Pill>],
    ]} />
)});
