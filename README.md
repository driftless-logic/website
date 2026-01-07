# Driftless Logic LLC Website

Marketing website for Driftless Logic LLC built with [Astro](https://astro.build).

## Development

```bash
npm install
npm run dev
```

Visit `http://localhost:4321` to view the site.

## Build

```bash
npm run build
```

Output goes to `./dist/`.

## Deployment

The site auto-deploys to AWS S3 + CloudFront via GitHub Actions when pushing to `main`.

### Required GitHub Secrets

- `AWS_ACCESS_KEY_ID` - IAM user access key
- `AWS_SECRET_ACCESS_KEY` - IAM user secret key

### Required GitHub Variables

- `S3_BUCKET_NAME` - Target S3 bucket name
- `AWS_REGION` - AWS region (defaults to us-east-1)
- `CLOUDFRONT_DISTRIBUTION_ID` - (Optional) CloudFront distribution ID for cache invalidation
