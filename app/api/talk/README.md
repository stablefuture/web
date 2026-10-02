# Talk form email

`/talk` sends messages through this route and Resend to `ben@stablefuture.uk`.
The sender is `talk@stablefuture.uk`; replies go to the visitor's email address.

## Required setup

- Set `RESEND_API_KEY` in the ignored `.env.local` file for local testing and in
  Vercel's Production environment for the live form. Keep the key server-side.
- Add and verify `stablefuture.uk` in Resend. An API key alone is not enough:
  Resend rejects messages from an unverified domain, and this route returns 502.
- Add the DNS records shown by Resend in Cloudflare: the `resend._domainkey` TXT
  record and the `rsend` and `send` CNAME records. Use the exact current values
  from Resend and set the CNAME records to **DNS only**.
- Keep the existing Google Workspace MX and SPF records. The form only needs
  sending enabled in Resend, not receiving.

## Check delivery

After Resend shows the domain as verified, send a clearly labelled test from
`/talk`. Check both the page's success message and the email's **Delivered**
status in Resend. A successful API response only confirms that Resend accepted
the email, not that it reached the inbox.

Pushing `main` deploys the website through Vercel. DNS verification takes effect
without a code deployment.
