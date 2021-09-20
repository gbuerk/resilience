# Resilience Bioreactor

## Demo
* See the demo at http://resilience-demo.ddns.net:4000/
## Run locally
* Prerequisites
    * This app requires npm and node to build and run
* Clone the repo
* Install dependencies
    * `npm install`
* Start dev server
    * `npm run dev`

## The code
* The starting point is `public/index.html` which references `src/main.ts` which references `src/App.svelte`
* `App.svelte` contains the whole single page app and pulls in all other dependent components

## Considerations
* App as a whole
    * The application build framework is Svelte.  I chose this because I am a big fan and have done many projects with it over the last 2 years.  It produces very tiny bundles when built and requires extremely few run time dependencies.
    * I chose to use typescript, though a very loosely enforced version.  In a larger project, I would enforce stricter rules
    * I would normally use some kind of toast or overlay to alert users to errors, rather than logging them to console.error
    * The main display object, `bioreactor` uses a Svelte Store, which is a generic solution for reactive client side state management provided by svelte.  It is akin to a Flux, Redux, or VueX store
* UI
    * I pulled in ChartJS for the gauges since I think it improves the UX of this app.  It makes it much easier to visually see the target ranges for fill percent and temperature.  I am currently using a CDN for this.  In a larger project, I would use NPM to install this dependency and bundle it with the application
    * I chose to use a "classless" css framework (MVP, in this case).  I feel like this provides a lot of utility for almost no effort and helps to foster good practices around semantic html
    * For the few custom css rules I apply here, I'm using Svelte's scoped css out of the box
    * The UI tracks the current step, meaning current thing an operator needs to know, and displays it prominently at the top of the page
    * Below that I put the gauges and the input buttons.  The hope was to keep this section small enough that the operator would not need to scroll, even on smaller screens
    * Below that I put the tabular output of statistics
        * **Note** This is currently the only place to find pH.  I did _not_ add a gauge for pH since there is no CPP driven from it.  This would be easy to add in the future
    * When the batch completes, the main input / current tabular statistics are swapped out for a batch report and a button to create another batch
* Service
    * I made BioreactorService a self contained instance that encapsulates its own state and is instantiable.  This allows for the "Next batch" button to work by simply creating a new instance, and everything else updates reactively.
    * I could have used an ES6 class for this but I slightly prefer the function syntax chosen here
    * I chose not to add a "client" layer, though in a larger project I would have created a client that would be called by the service and would abstract calls to the API
    * There are also several "static" type functions that are used as utilities, both for the BioreactorService and the UI itself
* Testing
    * I am using Jest as my test runner, mock library, and assertion library
    * I am currently > 80% covered, which would typically be my minimum goal.  I could definitely get this to 100% with a little more time / effort
    * I chose to only unit test the service tier.  I typically find unit testing the view tier to produce time consuming and brittle tests that change and break frequently.  As such, I would typically introduce a blackbox style test for the UI, something driven with Cypress, Puppeteer, or a Selenium derivative like Webdriver IO.
* Objective Ambiguity
    * There was a little ambiguity in the objective so I had to make a few assumptions.  Typically, I would resolve this in one of two ways:
        1. Collaborate with the product owner to arrive at a less ambiguous state before attempting a solution
        1. Provided it does not require painting myself into a corner, I might attempt a solution and then point out the assumptions I made in a review with the product owner or business representative.  I usually prefer this, with a bias toward action, but it depends on how divergent the solutions may become if my assumption is wrong.
    * In this case, I needed to make some assumptions about how fill level and temperature relate to time.
        * If the operator overfills the bioreactor, my solution _will_ allow them to empty some.  As long as they stop the fill within the range _at some point_ in the batch, the first CPP is deemed successful.  
        * This looks a bit funny if, say, the "Actually Fill Level", which I interpret as _maxFill_, may be well out of the threshold, say 80%, but the CPP #1 may still be successful.
        * This is also why the third section of the `Fill Percent` gear is yellow, not red.  
        * This would be easy enough to change.  In fact, the solution would be simpler if the batch was deemed a failure if the fill level exceeds the top of the range.