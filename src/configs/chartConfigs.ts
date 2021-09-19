import {LOW_FILL_BOUNDARY, HIGH_FILL_BOUNDARY, LOW_TEMP_BOUNDARY, HIGH_TEMP_BOUNDARY, HIGH_PRESSURE_BOUNDARY } from '../services/BioreactorService'

const sharedOptions = {
    responsive: true,
    showTooltips: true,
    layout: {
        padding: {
            bottom: 10
        }
    },
}

export const fillGaugeConfig = {
    type: 'gauge',
    data: {
        labels: [
            `0 - ${LOW_FILL_BOUNDARY}`, 
            `${LOW_FILL_BOUNDARY} - ${HIGH_FILL_BOUNDARY}`, 
            `${HIGH_FILL_BOUNDARY} - 100`
        ],
        datasets: [{
            data: [ LOW_FILL_BOUNDARY, HIGH_FILL_BOUNDARY, 100],
            value: 0.1,
            backgroundColor: [ 'yellow', 'green', 'yellow'],
            borderWidth: 2
        }]
    },
    options: {
        ...sharedOptions,
        valueLabel: {
            formatter: value => value.toFixed(2) + '%'
        },
        title: {
            display: true,
            text: 'Fill Percent'
        },
    }
}

export const tempGaugeConfig = {
    type: 'gauge',
    data: {
        labels: [
            `0 - ${LOW_TEMP_BOUNDARY}`, 
            `${LOW_TEMP_BOUNDARY} - ${HIGH_TEMP_BOUNDARY}`, 
            `${HIGH_TEMP_BOUNDARY} - 100`
        ],
        datasets: [{
            data: [ LOW_TEMP_BOUNDARY, HIGH_TEMP_BOUNDARY, 100],
            value: 0.1,
            backgroundColor: [ 'yellow', 'green', 'red'],
            borderWidth: 2
        }]
    },
    options: {
        ...sharedOptions,
        valueLabel: {
            formatter: value => value.toFixed(2) + ' ºC'
        },
        title: {
            display: true,
            text: 'Temperature (ºC)'
        },
    }
}

export const pressureGaugeConfig = {
    type: 'gauge',
    data: {
        labels: [
            `0 - ${HIGH_PRESSURE_BOUNDARY}`, 
            `${HIGH_PRESSURE_BOUNDARY} - 250`
        ],
        datasets: [{
            data: [ HIGH_PRESSURE_BOUNDARY, 250],
            value: 0.1,
            backgroundColor: [ 'green', 'red'],
            borderWidth: 2
        }]
    },
    options: {
        ...sharedOptions,
        valueLabel: {
            formatter: value => value.toFixed(2) + ' kPa'
        },
        title: {
            display: true,
            text: 'Pressure (kPA)'
        },
    }
}

