# When does a crowd tip?

An interactive version of Figure 4.3 from Timur Kuran's *Private Truths, Public Lies* (Harvard University Press, 1995). It shows how hidden opinions settle, and how a small spark can tip a whole crowd.

Built for Uri at [Atoms vs Bits](https://www.atvbt.com/widget-help-request/).

## The idea in one paragraph

People often hide what they think until enough others speak up first. Each person has a threshold: the share of the public that must already be speaking up before they join. The propagation curve shows, for every expected level of public opinion, how many would actually speak up. Opinion settles where that curve crosses the diagonal (expectation equals reality). When the curve has two such resting points, a small nudge to everyone's threshold can erase one, and opinion jumps to the other.

## Using it

- Click the chart or the ground to drop the ball at a starting expectation.
- Drag the white dots to reshape the crowd.
- Pick a crowd size (10, 100, or 1,000 people).
- Move the spark slider to lower or raise every threshold.
- Copy link saves the current setup in the URL.

## Embedding

Add `?embed` to the URL to hide the title and explainer. In a Ghost post, use an HTML card:

```html
<iframe src="https://YOUR-USERNAME.github.io/kuran-cascades/?embed" width="100%" height="1100" style="border:0" loading="lazy" title="When does a crowd tip?"></iframe>
```

## Files

- `index.html`: the page (no build step, no dependencies)
- `model.js`: the threshold model, curve math, and resting point finder
- `test/model.test.mjs`: checks the model against the book (an expectation of 20 yields 35; opinion settles at 40)

Run the tests with `npm test` (Node 18 or newer).

## Credits

Model: Timur Kuran (1995), building on Mark Granovetter, "Threshold Models of Collective Behavior" (1978). Code by Chris Henry. MIT license.
