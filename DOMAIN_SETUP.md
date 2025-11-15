# Custom Domain Setup - pulsechat.space

## Domain Configuration

Your domain `pulsechat.space` has been added to Vercel.

## DNS Configuration Required

To make your domain work, you need to configure DNS records with your domain registrar:

### Option 1: Use Vercel Nameservers (Recommended)
1. Go to your domain registrar (where you bought pulsechat.space)
2. Update nameservers to:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
3. Wait for DNS propagation (can take up to 48 hours, usually much faster)

### Option 2: Add DNS Records Manually
Add these DNS records at your domain registrar:

**For root domain (pulsechat.space):**
- Type: `A`
- Name: `@` or `pulsechat.space`
- Value: `76.76.21.21`

**For www subdomain (www.pulsechat.space):**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

## Verify Domain

After DNS is configured:
1. Vercel will automatically detect and verify the domain
2. SSL certificate will be automatically provisioned
3. Your site will be accessible at:
   - https://pulsechat.space
   - https://www.pulsechat.space

## Check Domain Status

```bash
vercel domains ls
```

Or check in Vercel Dashboard:
https://vercel.com/apexs-projects-f6e17e08/pulse/settings/domains

## Troubleshooting

- **Domain not resolving**: Wait for DNS propagation (up to 48 hours)
- **SSL not working**: Wait for certificate provisioning (usually automatic)
- **Domain not verified**: Check DNS records are correct

## Next Steps

1. ✅ Domain added to Vercel
2. ⏳ Configure DNS at your registrar
3. ⏳ Wait for DNS propagation
4. ⏳ SSL certificate will auto-provision
5. ✅ Site will be live at pulsechat.space!

