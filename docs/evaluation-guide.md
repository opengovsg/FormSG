---
description: >-
  This guide helps government IT teams and decision makers evaluate whether
  FormSG is the right forms solution for your organization.
---

# ✏️ Evaluation Guide

FormSG has processed 200+ million government form submissions across 160+ agencies. Atleast three governments have already successfully deployed it independently.

**Bottom Line**: If you need secure, customizable government forms with full data control, FormSG offers proven technology.&#x20;

See our metrics and success stories here!

{% embed url="https://reports.open.gov.sg/formsg/overview" %}

### Government Success Stories

**Before this guide existed**, government teams worldwide successfully forked and deployed FormSG for their local contexts.&#x20;

* :flag\_lk: Sri Lanka ([FormLK](https://forms.gov.lk/))
* :flag\_kh: Cambodia ([FormKH](https://form.gov.kh/))
* :flag\_vn: Vietnam ([FormVN](https://form.gov.vn/))

These earlier implementations prove FormSG's adaptability and demonstrate that self-hosting is not only possible but practical for government use.

### Decision Framework: Is FormSG Right for You?

<details>

<summary>✅ FormSG if a good fit if</summary>

* Processing a lot of forms monthly
* Need data sovereignty for citizen information
* Want to eliminate vendor lock-in
* Have technical team (or can hire contractors)
* Current form solution costs >$50k/year

</details>

<details>

<summary>❌ FormSG may not fit if</summary>

* Need vendor support/SLAs
* Processing <100 forms monthly
* No technical capabilities
* Need immediate deployment (<1 month)

</details>

<details>

<summary><span data-gb-custom-inline data-tag="emoji" data-code="1f914">🤔</span> More Benefits</summary>

* Integrate with any government system
* Customize workflows without vendor charges
* Scale without per-form fees
* Own your citizen data

</details>

### Technical Feasibility Assessment

While this is not a minimum or hard requirement, these are just **guidance points to help you assess whether your team is ready for FormSG self-hosting**. Many government teams successfully deploy\
FormSG by learning these skills during implementation or partnering\
with experienced contractors.

{% columns %}
{% column %}
**Minimum Technical Skills Needed:**

* Basic Linux server administration
* Docker or container orchestration experience
* Environment variable and secrets management
* Working with Node.js applications
* Understanding of web application security
{% endcolumn %}

{% column %}
**Team Capabilities:**

* **Small teams (1-2 people)**: Full-stack developers who can learn DevOps
* **Medium teams (2-4 people)**: Mix of development and infrastructure skills
* **Large teams (5+ people)**: Can specialize in DevOps, development, and security

These skills can be distributed across your team based on size.
{% endcolumn %}
{% endcolumns %}

{% hint style="success" %}
**Remember**: You don't need all these skills on day one. Many teams build expertise while implementing FormSG.
{% endhint %}

**For more technical info**

* [aws-production-deployment.md](aws-production-deployment.md "mention")
* [infrastructure-guidance.md](infrastructure-guidance.md "mention")
* [component-customization.md](component-customization.md "mention")

### Legal and Compliance Considerations

#### ⚠️ CRITICAL: Remove Singapore Government Branding

**BEFORE ANY DEPLOYMENT**: You MUST remove Singapore-specific branding to avoid legal issues and trademark violations. **See** [legal-and-compliance.md](legal-and-compliance.md "mention") on on complete removal instructions.

### Cost-Benefit Analysis Framework

**Initial Investment:**

* **Setup Time**: 160-300 hours (4-8 weeks of effort)
* **Infrastructure**: $120-300/month
* **Timeline**: 2-3 months to production

**Ongoing Investment:**

* **Maintenance**: \~0.25 FTE annually (10-20 hours/month)
* **Infrastructure**: $120-300/month continues

**Typical Return:**

* **Break-even**: 6-12 months vs commercial solutions
* **Annual savings**: $50-100k vs enterprise form platforms
* **Plus**: Data sovereignty, no vendor lock-in, unlimited forms

_Note: Smaller deployments need less time. Many teams start simple and grow._

{% hint style="warning" %}
**This is a work-in-progress guide.** \
Time estimates and costs are approximations and may vary significantly based on your specific context.
{% endhint %}

### Deployment Options Overview

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><strong>Just docker up on VMs</strong></td><td><ul><li><strong>Effort</strong>: Low</li><li><strong>Timeline</strong>: Few days</li><li><strong>Customization</strong>: Minimal (environment variables only)</li><li><strong>Best for</strong>: Pilot projects, proof-of-concept, small team evaluation</li></ul></td></tr><tr><td><h4>Standard AWS Deployment</h4></td><td><ul><li><strong>Effort</strong>: Low-Medium</li></ul><ul><li><strong>Timeline</strong>: 2-4 weeks</li></ul><ul><li><strong>Customization</strong>: Minimal required</li></ul><ul><li><strong>Best for</strong>: Teams wanting to get started quickly</li></ul></td></tr><tr><td><p></p><h4>Multi-Cloud Deployment</h4></td><td><ul><li><strong>Effort</strong>: Medium-High</li><li><strong>Timeline</strong>: 4-8 weeks</li><li><strong>Customization</strong>: Component replacement required</li><li><strong>Best for</strong>: Teams with existing cloud investments</li></ul></td></tr><tr><td><h4>On-Premises Deployment</h4></td><td><ul><li><strong>Effort</strong>: High</li></ul><ul><li><strong>Timeline</strong>: 8-12 weeks</li></ul><ul><li><strong>Customization</strong>: Extensive infrastructure work</li></ul><ul><li><strong>Best for</strong>: Air-gapped or highly regulated environments</li></ul></td></tr><tr><td><h4>Hybrid Government Cloud</h4></td><td><ul><li><strong>Effort</strong>: Medium-High</li></ul><ul><li><strong>Timeline</strong>: 6-10 weeks</li></ul><ul><li><strong>Customization</strong>: Government-specific integrations</li></ul><ul><li><strong>Best for</strong>: Teams with existing government cloud infrastructure</li></ul></td></tr></tbody></table>

### Decision Points and Next Steps

**If Proceeding with FormSG:**

1. **Start Small**: Set up local development environment
2. **Plan Deployment**: Review basic deployment guide
3. **Identify Customizations**: Assess component customization needs
4. **Prepare Team**: Train staff on required technologies

**If Uncertain:**

1. **Proof of Concept**: Deploy locally and test with sample forms
2. **Expert Consultation**: Engage with FormSG community or consultants
3. **Vendor Comparison**: Evaluate commercial alternatives side-by-side
4. **Pilot Project**: Start with non-critical forms to reduce risk

***

{% hint style="success" %}
**Key Takeaway**: FormSG is a powerful, flexible government forms platform that requires technical investment but provides complete control and customization. Success depends on having the right skills, resources, and commitment to the implementation journey.
{% endhint %}

**Ready to move forward?** Start with our Quickstart Guide to get hands-on experience with FormSG.
