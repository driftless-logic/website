# Driftless Logic Website Architecture

## Overview

The Driftless Logic website is a static marketing site built with Astro and deployed to AWS using S3, CloudFront, and Lambda for the contact form.

```mermaid
flowchart TB
    subgraph "User"
        Browser[Browser]
    end

    subgraph "DNS - Cloudflare"
        CF_DNS[Cloudflare DNS]
    end

    subgraph "AWS - Content Delivery"
        CloudFront[CloudFront Distribution<br/>E2BVWF36QXDIT3]
        ACM[ACM Certificate<br/>791c1752-8664-44b7-8198-1c91588e352e]
        S3[S3 Bucket<br/>driftlesslogic.com]
    end

    subgraph "AWS - Contact Form"
        Lambda[Lambda Function<br/>driftless-contact-form]
        SES[SES Email Service]
    end

    Browser -->|https://driftlesslogic.com| CF_DNS
    CF_DNS -->|CNAME| CloudFront
    CloudFront -->|SSL| ACM
    CloudFront -->|Origin| S3
    Browser -->|POST /contact| Lambda
    Lambda -->|Send Email| SES
    SES -->|Deliver| Email[jake@driftlesslogic.com]
```

## Domain Configuration

| Domain | Type | Target | Proxy |
|--------|------|--------|-------|
| `driftlesslogic.com` | CNAME | `dnowjfwnsnyxu.cloudfront.net` | DNS only |
| `www.driftlesslogic.com` | CNAME | `dnowjfwnsnyxu.cloudfront.net` | DNS only |
| `_dfc401acce991b164e0363b76a063ef1` | CNAME | `_242fb912b4ba2f19e19c2c1a471639c5.jkddzztszm.acm-validations.aws` | DNS only |

**DNS Provider:** Cloudflare
**Domain Registrar:** GoDaddy
**Nameservers:** `ajay.ns.cloudflare.com`, `monika.ns.cloudflare.com`

## AWS Resources

### S3 Bucket

| Property | Value |
|----------|-------|
| Bucket Name | `driftlesslogic.com` |
| Region | `us-east-1` |
| Static Website Hosting | Enabled |
| Index Document | `index.html` |
| Error Document | `404.html` |
| Public Access | Enabled via bucket policy |

### CloudFront Distribution

| Property | Value |
|----------|-------|
| Distribution ID | `E2BVWF36QXDIT3` |
| Domain | `dnowjfwnsnyxu.cloudfront.net` |
| Alternate Domains | `driftlesslogic.com`, `www.driftlesslogic.com` |
| SSL Certificate | ACM `791c1752-8664-44b7-8198-1c91588e352e` |
| Price Class | `PriceClass_All` |
| HTTP Version | HTTP/2 |
| IPv6 | Enabled |
| Viewer Protocol Policy | Redirect HTTP to HTTPS |
| Cache Policy | `658327ea-f89d-4fab-a63d-7e88639e58f6` (Managed-CachingOptimized) |

### ACM Certificate

| Property | Value |
|----------|-------|
| Certificate ARN | `arn:aws:acm:us-east-1:699420354987:certificate/791c1752-8664-44b7-8198-1c91588e352e` |
| Domain Names | `driftlesslogic.com`, `*.driftlesslogic.com` |
| Status | Issued |
| Validation Method | DNS |
| Region | `us-east-1` (required for CloudFront) |

### Lambda Function (Contact Form)

| Property | Value |
|----------|-------|
| Function Name | `driftless-contact-form` |
| Runtime | Node.js 20.x |
| Handler | `index.handler` |
| Function URL | `https://spybovnq3nkwxp33ix5styhgu40ddkob.lambda-url.us-east-1.on.aws/` |
| Auth Type | None (public) |
| IAM Role | `driftless-contact-form-role` |

```mermaid
sequenceDiagram
    participant User
    participant Form as Contact Form
    participant Lambda
    participant SES
    participant Email as jake@driftlesslogic.com

    User->>Form: Fill out form
    User->>Form: Click Submit
    Form->>Lambda: POST JSON payload
    Lambda->>Lambda: Validate input
    Lambda->>SES: SendEmail command
    SES->>Email: Deliver email
    Lambda->>Form: 200 OK
    Form->>User: Success message
```

### SES (Simple Email Service)

| Property | Value |
|----------|-------|
| Verified Identity | `jake@driftlesslogic.com` |
| Region | `us-east-1` |
| Mode | Sandbox (verified addresses only) |

### IAM User

| Property | Value |
|----------|-------|
| Username | `github-actions-driftless` |
| Access Key ID | `AKIA2FWFTVGVU7SYYU4Z` |
| Policies | `AmazonS3FullAccess`, `CloudFrontFullAccess`, `AmazonSESFullAccess`, `AWSLambda_FullAccess`, `AmazonAPIGatewayAdministrator` |

### IAM Role (Lambda)

| Property | Value |
|----------|-------|
| Role Name | `driftless-contact-form-role` |
| ARN | `arn:aws:iam::699420354987:role/driftless-contact-form-role` |
| Trusted Entity | AWS Lambda |
| Policies | `AmazonSESFullAccess` |

## CI/CD Pipeline

```mermaid
flowchart LR
    subgraph "GitHub"
        Push[Push to main]
        PR[Pull Request]
        Actions[GitHub Actions]
    end

    subgraph "Build"
        Checkout[Checkout Code]
        Setup[Setup Node.js 20]
        Install[npm ci]
        Build[npm run build]
        Artifact[Upload Artifact]
    end

    subgraph "Deploy"
        Download[Download Artifact]
        Creds[Configure AWS Creds]
        S3Sync[S3 Sync]
        Invalidate[CloudFront Invalidate]
    end

    Push --> Actions
    PR --> Actions
    Actions --> Checkout --> Setup --> Install --> Build --> Artifact
    Artifact --> Download --> Creds --> S3Sync --> Invalidate
```

### GitHub Repository

| Property | Value |
|----------|-------|
| Repository | `driftless-logic/website` |
| Branch | `main` |
| Workflow | `.github/workflows/deploy.yml` |

### GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |

### GitHub Variables

| Variable | Value |
|----------|-------|
| `AWS_S3_BUCKET` | `driftlesslogic.com` |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | `E2BVWF36QXDIT3` |
| `AWS_REGION` | `us-east-1` |

## Project Structure

```
driftless/
├── arch/
│   └── architecture.md          # This file
├── lambda/
│   └── contact-form/
│       ├── index.mjs            # Lambda function code
│       └── function.zip         # Deployment package
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro         # Base layout with Tailwind config
│   └── pages/
│       ├── index.astro          # Homepage
│       ├── methodology.astro    # Driftless Methodology
│       ├── swarm.astro          # Driftless Swarm product
│       ├── about.astro          # About / Founder story
│       └── contact.astro        # Contact form
├── public/
│   └── favicon.svg
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro |
| Styling | Tailwind CSS (CDN) |
| Icons | Google Material Symbols |
| Fonts | Manrope (Google Fonts) |
| Hosting | AWS S3 + CloudFront |
| SSL | AWS ACM |
| DNS | Cloudflare |
| Email | AWS SES |
| Serverless | AWS Lambda |
| CI/CD | GitHub Actions |

## URLs

| Environment | URL |
|-------------|-----|
| Production | https://driftlesslogic.com |
| Production (www) | https://www.driftlesslogic.com |
| CloudFront Direct | https://dnowjfwnsnyxu.cloudfront.net |
| Contact Form API | https://spybovnq3nkwxp33ix5styhgu40ddkob.lambda-url.us-east-1.on.aws/ |

## Cost Estimates (Monthly)

| Service | Estimated Cost |
|---------|----------------|
| S3 | ~$0.50 (storage + requests) |
| CloudFront | ~$1-5 (depending on traffic) |
| Lambda | Free tier (1M requests/month) |
| SES | Free tier (62K emails/month) |
| ACM | Free |
| Route 53 / Cloudflare | Free (Cloudflare) |
| **Total** | **~$2-6/month** |

## Security Considerations

1. **HTTPS Everywhere**: CloudFront redirects all HTTP to HTTPS
2. **TLS 1.2+**: Minimum protocol version enforced
3. **No Secrets in Code**: AWS credentials stored in GitHub Secrets
4. **SES Sandbox**: Email sending limited to verified addresses
5. **Lambda Public Access**: Contact form endpoint is intentionally public
6. **CORS**: Lambda function URL configured with appropriate CORS headers
7. **Input Validation**: Lambda validates required fields and email format

## Future Considerations

- [ ] Request SES production access for sending to any email
- [ ] Add custom error pages (403, 404, 500)
- [ ] Implement rate limiting on contact form
- [ ] Add Google Analytics or Plausible
- [ ] Set up CloudWatch alarms for Lambda errors
- [ ] Consider adding a staging environment
