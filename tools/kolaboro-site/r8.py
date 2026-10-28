# Round 8: payments with PayPal (one-off pre-purchase check), /thanks page, refund terms.
PAYPAL_CHECK = 'https://www.paypal.com/ncp/payment/32ENX4QK833GE'

PAYNOW = ('<p class="paynow" hidden><b>Want us to start now?</b> You can pay the €490 pre-purchase check securely with PayPal or card. '
          'If we can\'t take your case, we refund you in full. <a class="btn btn-hi" style="margin-top:12px" href="' + PAYPAL_CHECK +
          '" rel="noopener" data-ev="pay_check_after_lead">Pay €490 with PayPal</a></p>')

def build_thanks():
    body = phero('Payment received', 'Thank you. Your check is booked.',
                 "We've received your payment. Within two working days we'll email you to confirm the project details and the date of the site visit.",
                 '<div class="hero-cta"><a class="btn btn-hi" href="/report/sample">See what your report will look like</a><a class="btn btn-line" href="/checklist">Use the checklist while you wait</a></div>')
    body += f'''<section class="sec"><div class="wrap grid2">
  <div><h2>What happens next</h2></div>
  <div class="prose"><ol>
    <li>We confirm the project and what you've been promised. Reply to our email with any contract or brochure you have.</li>
    <li>A local Kolaboro agent checks title, zoning, permits and the developer, and visits the site with GPS-stamped photos and video.</li>
    <li>You get a written report within 7 days of confirmation.</li>
  </ol>
  <p>If we can't take your case, we refund you in full. Questions: <a href="mailto:{CONTACT}">{CONTACT}</a>.</p></div>
</div></section>
<script>try{{if(/paid=check/.test(location.search)&&window.gtag)gtag('event','purchase',{{currency:'EUR',value:490,items:[{{item_name:'Pre-purchase check'}}]}});}}catch(e){{}}</script>'''
    out = page('/thanks', 'Thank you | Kolaboro', 'Your Kolaboro pre-purchase check is booked.', body)
    fp = os.path.join(OUT, 'thanks', 'index.html')
    if os.path.exists(fp):
        s = open(fp).read(); s = s.replace('<head>', '<head>\n<meta name="robots" content="noindex">', 1); open(fp, 'w').write(s)
    return out

R8 = [
  # success box: pay-now offer (shown only to buyers, by site.js)
  ('    <li><a href="/tools/yield-check">Check if a promised rental yield is realistic</a></li>\n  </ul>\n</div>',
   '    <li><a href="/tools/yield-check">Check if a promised rental yield is realistic</a></li>\n  </ul>\n  ' + PAYNOW + '\n</div>'),
  # pricing tile: direct payment option
  ('<a class="btn btn-line" href="/#start" data-role="buyer" data-ev="pricing_check">Book a check</a></div>',
   '<a class="btn btn-line" href="/#start" data-role="buyer" data-ev="pricing_check">Book a check</a>'
   '<p class="per" style="margin-top:10px">or <a href="' + PAYPAL_CHECK + '" rel="noopener" data-ev="pay_check_pricing">pay now with PayPal</a>. Full refund if we can\'t take your case.</p></div>'),
  # terms
  ('<h2>Payments and escrow</h2><p>Kolaboro does not currently hold client money.',
   '<h2>Paying for a check</h2><p>Pre-purchase checks are paid in advance through PayPal (PayPal balance or card). If we can\'t take your case, or can\'t start within 7 days of confirming it, we refund the full amount. Once the site visit has taken place, the fee is not refundable. Monthly monitoring and buyer\'s agent services are invoiced separately after we agree the scope.</p>\n<h2>Payments and escrow</h2><p>Kolaboro does not currently hold client money for property purchases.'),
]

R8.append(('<h2>What we sell</h2>\n<ul>\n<li><b>Buyers:</b>',
  '<h2>What kind of company this is</h2>\n<ul>\n'
  '<li><b>An AI-native service.</b> Buyers don\'t get software to figure it out themselves. We sell the work: a verified answer, with evidence, in 7 days.</li>\n'
  '<li><b>Experts made with AI.</b> Our own research agent, built on Claude, reads what developers promise. Local agents without professional credentials, trained and checked by AI and by us, verify it on site.</li>\n'
  '<li><b>Built for AI assistants too.</b> Our research and methodology are published in machine-readable form, so the AI assistants people use to plan a purchase abroad can rely on them.</li>\n'
  '</ul>\n<h2>What we sell</h2>\n<ul>\n<li><b>Buyers:</b>'))

def r8_fixes():
    n = 0
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            for a, b in R8: s = s.replace(a, b)
            if s != o: open(p, 'w').write(s); n += 1
    return n

def build_round8():
    return [build_thanks()]
