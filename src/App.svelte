<script lang="ts">
import { BioreactorService, ValveState, shouldPlayAlert, getCurrentStep, getCurrentValveStatusMessage } from './services/BioreactorService'
import BioreactorGauges from './components/BioreactorGauges.svelte'
import BioreactorReport from './components/BioreactorReport.svelte'
import BioreactorCurrentStats from './components/BioreactorCurrentStats.svelte'
import BioreactorCurrentStats from './components/BioreactorCurrentStats.svelte'
import Spinner from 'svelte-spinner'

const audio = new Audio('/Ding-sound-effect.mp3')
let bioreactorService = BioreactorService()
bioreactorService.createBioreactor()

$: bioreactorStore = bioreactorService.bioreactorStore

// This syntax will subscribe to the bioreactorStore (and schedule the appropriate unsubscribe on destroy of this component)
// and reactively store its value in bioreactor for use throughout the app.  The interface of this object is defined in BioreactorService.
$: bioreactor = $bioreactorStore

// Initially, bioreactor will be an empty object (before the call to /bioreactor/0 returns).  This will resolve true when bioreactor.id exists
$: isBioreactorLoaded = !!bioreactor.id 

$: isBatchComplete = !!bioreactor.totalTime

// Update the current step and play an alert sound if necessary
let currentStep, previousStep, currentState
$: if (isBioreactorLoaded) {
	currentState = getCurrentValveStatusMessage(bioreactor)
	currentStep = getCurrentStep(bioreactor)
	if (shouldPlayAlert(currentStep, previousStep)) {
		audio.play()
	}
	previousStep = currentStep
}

async function toggleInputValve() {
	try {
		await bioreactorService.toggleInputValve()
	} catch (e) {
		console.error('Error toggling input valve: ', e)
	}
}
async function toggleOutputValve() {
	try {
		await bioreactorService.toggleOutputValve()
	} catch (e) {
		console.error('Error toggling input valve: ', e)
	}
}

function createNewBioreactor() {
	bioreactorService = BioreactorService()
	bioreactorService.createBioreactor()
}

</script>

<header>
	<h1>Resilience Bioreactor</h1>
</header>

<main>
	{#if isBioreactorLoaded}
		<section>
			<header>
				<h2>{currentStep}</h2>
			</header>
			<BioreactorGauges {bioreactor} />
		</section>

		{#if isBatchComplete}
			<BioreactorReport {bioreactor} />
			<section>
				<p>
					<button on:click={createNewBioreactor}>Next batch</button>
				</p>
			</section>
		{:else}
			<section>
				<header><h3>Current State: {currentState}</h3></header>
				<p>
					<button class:open={bioreactor.inputValveState === ValveState.OPEN} on:click={toggleInputValve}>{bioreactor.inputValveState === ValveState.OPEN ? 'Close' : 'Open'} input
						valve</button>
					<button class:open={bioreactor.outputValveState === ValveState.OPEN} on:click={toggleOutputValve}>{bioreactor.outputValveState === ValveState.OPEN ? 'Close' : 'Open'}
						output valve</button>
				</p>
			</section>
			<BioreactorCurrentStats {bioreactor} />
		{/if}
	{:else}
		<div class="spinner-wrapper">
			<Spinner size="150" color="var(--color)" />
		</div>
	{/if}
</main>

<style>
header, main {
	padding: 1rem;
}
.open {
	background-color: #ddd;
	color: #333
}
.spinner-wrapper {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>