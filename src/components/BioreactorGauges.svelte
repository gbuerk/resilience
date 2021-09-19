<script>
import { onMount } from 'svelte'
import { fillGaugeConfig, tempGaugeConfig, pressureGaugeConfig } from '../configs/chartConfigs.ts'

export let bioreactor

let fillGaugeCanvas, fillGauge
let tempGaugeCanvas, tempGauge
let pressureGaugeCanvas, pressureGauge

onMount(() => {
	fillGauge = new Chart(fillGaugeCanvas.getContext('2d'), fillGaugeConfig);
	tempGauge = new Chart(tempGaugeCanvas.getContext('2d'), tempGaugeConfig);
	pressureGauge = new Chart(pressureGaugeCanvas.getContext('2d'), pressureGaugeConfig);
})

$: if (fillGauge) { // this means that all the gauges have been initialized
	fillGauge.config.data.datasets[0].value = bioreactor.fill_percent
	fillGauge.update()
	tempGauge.config.data.datasets[0].value = bioreactor.temperature
	tempGauge.update()
	pressureGauge.config.data.datasets[0].value = bioreactor.pressure
	pressureGauge.update()
}
</script>

<div class="gaugeWrapper">
	<canvas bind:this={fillGaugeCanvas} />
	<canvas bind:this={tempGaugeCanvas} />
	<canvas bind:this={pressureGaugeCanvas} />
</div>

<style>
.gaugeWrapper {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
}
canvas {
	-moz-user-select: none;
	-webkit-user-select: none;
	-ms-user-select: none;
	max-width: 360px;
}
</style>