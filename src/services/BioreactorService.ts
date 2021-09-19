import { writable } from "svelte/store"


// Constants
const BASE_URL = 'http://mini-mes.resilience.com'
const INTERVAL_TIME = 500
export const WARN_FILL_BOUNDARY = 60
export const TARGET_FILL = 70
export const LOW_FILL_BOUNDARY = TARGET_FILL - (TARGET_FILL * .02)
export const HIGH_FILL_BOUNDARY = TARGET_FILL + (TARGET_FILL * .02)
export const WARN_TEMP_BOUNDARY = 70
export const TARGET_TEMP = 80
export const LOW_TEMP_BOUNDARY = 79
export const HIGH_TEMP_BOUNDARY = 81
export const HIGH_PRESSURE_BOUNDARY = 200


/**
 * This is the main service that allows the UI to create a bioreactor instance, act on it (base on user input)
 * and subscribe to its changes via a reactive Svelte store
 * 
 * @returns A BioreactorService with methods to create act upon a bioreactor instance
 */
export function BioreactorService() {

    // Internal state
    let bioreactor: Bioreactor
    const bioreactorStore = writable({}) // a writable svelte store used to allow the UI to subscribe to the bioreactor values

    /**
     * Create a new bioreactor on the server, store it locally, and prepopulate local variables
     */
    async function createBioreactor(): Promise<void> {
        try {
            const createRes = await fetch(`${BASE_URL}/bioreactor/0`)
            const data = await createRes.json()
            const bioreactorId = data.id
            const getRes = await fetch(`${BASE_URL}/bioreactor/${bioreactorId}`)
            bioreactor = await getRes.json()
            bioreactor.lowTemp = bioreactor.highTemp = bioreactor.temperature
            bioreactor.lowPressure = bioreactor.highPressure = bioreactor.pressure
            bioreactor.lowpH = bioreactor.highpH = bioreactor.pH
            bioreactor.maxFill = bioreactor.fill_percent
            bioreactor.cpp1 = CppResult.FAILURE
            bioreactor.inputValveState = ValveState.CLOSED
            bioreactor.outputValveState = ValveState.CLOSED
            updateBioreactor({...bioreactor, id: bioreactorId})
        } catch (e) {
            console.error('Error creating bioreactor: ', e)
        }
    }

    /**
     * Internal function used to turn on and off the mechanism that polls the server for updates to the bioreactor
     */
    function toggleInterval(): void {
        if (bioreactor.interval) {
            clearInterval(bioreactor.interval)
            bioreactor.interval = undefined
        } else {
            bioreactor.interval = setInterval(() => updateBioreactorStats(), INTERVAL_TIME)
        }
    }

    /**
     * Function used to open and close the input valve on the server
     * It also starts the polling mechanism the first time the input valve is opened
     */
    async function toggleInputValve(): Promise<void> {
        if (!bioreactor.startTime) {
            bioreactor.startTime = new Date()
            bioreactor.interval = setInterval(() => updateBioreactorStats(), INTERVAL_TIME)
        }
        bioreactor.inputValveState = bioreactor.inputValveState === ValveState.CLOSED ? ValveState.OPEN : ValveState.CLOSED
        await fetch(`${BASE_URL}/bioreactor/${bioreactor.id}/input-valve`, {
            method: 'PUT',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                state: bioreactor.inputValveState
            })
        })
        updateBioreactor()

    }

    /**
     * Function used to open and close the output valve on the server
     */
    async function toggleOutputValve(): Promise<void> {
        bioreactor.outputValveState = bioreactor.outputValveState === ValveState.CLOSED ? ValveState.OPEN : ValveState.CLOSED
        await fetch(`${BASE_URL}/bioreactor/${bioreactor.id}/output-valve`, {
            method: 'PUT',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                state: bioreactor.outputValveState
            })
        })
        updateBioreactor()

    }

    /**
     * Function used to poll the server for current stats on a bioreactor
     */
    async function updateBioreactorStats(): Promise<void> {
        const res = await fetch(`${BASE_URL}/bioreactor/${bioreactor.id}`)
        const data = await res.json()
        updateBioreactor(data)
    }

    /**
     * Function to update the local bioractor store which triggers reactivity for anyone subscribed to the store
     */
    function updateBioreactor(data: Record<string, unknown> = {}): void {
        // Merge existing and new data
        bioreactor = {
            ...bioreactor, 
            ...data,
        }

        // Update several internal state variables based on newly merged bioreactor
        bioreactor = updateInternalState(bioreactor)

        if (isBatchComplete(bioreactor)) { 
            bioreactor.totalTime = (new Date().getTime() - bioreactor.startTime.getTime()) / 1000
            bioreactor.batchOutcome = (bioreactor.cpp1 === CppResult.SUCCESS
                                        && bioreactor.cpp2 === CppResult.SUCCESS 
                                        && bioreactor.cpp3 === CppResult.SUCCESS) ? CppResult.SUCCESS : CppResult.FAILURE
            toggleInterval()
        }

        bioreactorStore.set(bioreactor)
    }

    // The public API of this service
    return {
        createBioreactor,
        toggleInputValve,
        toggleOutputValve,
        bioreactorStore,
        toggleInterval,
        updateBioreactorStats,
    }

}

export interface Bioreactor {
    id?: string
    fill_percent?: number
    pH?: number
    pressure?: number
    temperature?: number
    state?: string
    inputValveState?: ValveState
    outputValveState?: ValveState
    maxFill?: number
    totalTime?: number
    lowTemp?: number
    highTemp?: number
    lowPressure?: number
    highPressure?: number
    lowpH?: number
    highpH?: number,
    cpp1?: CppResult
    cpp2?: CppResult
    cpp3?: CppResult
    batchOutcome?: CppResult
    startTime?: Date
    interval?: NodeJS.Timer
}

export enum ValveState {
    OPEN = 'open',
    CLOSED = 'closed'
}

export enum CppResult {
    SUCCESS = 'Success',
    FAILURE = 'Failure'
}

export function isBatchComplete(bioreactor: Bioreactor): boolean {
    return bioreactor.outputValveState === ValveState.OPEN && bioreactor.fill_percent === 0 && !!bioreactor.startTime
}

export function isCpp1CurrentlyMet(bioreactor: Bioreactor): boolean {
    return bioreactor.inputValveState === ValveState.CLOSED 
            && bioreactor.outputValveState === ValveState.CLOSED 
            && bioreactor.fill_percent >= LOW_FILL_BOUNDARY 
            && bioreactor.fill_percent <= HIGH_FILL_BOUNDARY
}

export function isCpp2CurrentlyMet(bioreactor: Bioreactor): boolean {
    return bioreactor.highTemp <= HIGH_TEMP_BOUNDARY 
            && bioreactor.highTemp >= LOW_TEMP_BOUNDARY
}

export function isCpp3CurrentlyMet(bioreactor: Bioreactor): boolean {
    return bioreactor.highPressure < HIGH_PRESSURE_BOUNDARY
}

/**
 * function used to return a new bioreactor updated with new internal state and CPPs
 */
export function updateInternalState(bioreactor: Bioreactor): Bioreactor {
    const newBioreactor = {...bioreactor}
    if (newBioreactor.temperature < newBioreactor.lowTemp) {
        newBioreactor.lowTemp = newBioreactor.temperature
    }
    if (newBioreactor.temperature > newBioreactor.highTemp) {
        newBioreactor.highTemp = newBioreactor.temperature
    }
    if (newBioreactor.pressure < newBioreactor.lowPressure) {
        newBioreactor.lowPressure = newBioreactor.pressure
    }
    if (newBioreactor.pressure > newBioreactor.highPressure) {
        newBioreactor.highPressure = newBioreactor.pressure
    }
    if (newBioreactor.pH < newBioreactor.lowpH) {
        newBioreactor.lowpH = newBioreactor.pH
    }
    if (newBioreactor.pH > newBioreactor.highpH) {
        newBioreactor.highpH = newBioreactor.pH
    }
    if (newBioreactor.fill_percent > newBioreactor.maxFill) {
        newBioreactor.maxFill = newBioreactor.fill_percent
    }
    if (isCpp1CurrentlyMet(newBioreactor)) { // intentionally DON'T reset to FAILURE 
        newBioreactor.cpp1 = CppResult.SUCCESS
    }
    newBioreactor.cpp2 = isCpp2CurrentlyMet(newBioreactor) ? CppResult.SUCCESS : CppResult.FAILURE
    newBioreactor.cpp3 = isCpp3CurrentlyMet(newBioreactor) ? CppResult.SUCCESS : CppResult.FAILURE
    return newBioreactor
}

/**
 * Determine what to display to the operator as the current concern / direction
 */
export function getCurrentStep(bioreactor: Bioreactor): string {
    let currentStep

    if (bioreactor.cpp3 === CppResult.FAILURE) {
        currentStep = 'Too much pressure - Empty'
    } else if (bioreactor.cpp1 === CppResult.FAILURE) {
        if (bioreactor.fill_percent < WARN_FILL_BOUNDARY) {
            currentStep = `Fill to ${TARGET_FILL} +/- 2%`
        } else if (bioreactor.fill_percent < LOW_FILL_BOUNDARY) {
            currentStep = `Almost there - Prepare to STOP filling at ${TARGET_FILL} +/- 2...`
        } else if (bioreactor.fill_percent <= HIGH_FILL_BOUNDARY) {
            currentStep = 'STOP filling'
        } else {
            currentStep = 'Too full - Let some out'
        }
    } else if (bioreactor.cpp2 === CppResult.FAILURE) {
        if (bioreactor.highTemp < WARN_TEMP_BOUNDARY) {
            currentStep =`Wait for temperature to rise to ${TARGET_TEMP} +/- 1 ºC`
        } else if (bioreactor.highTemp < LOW_TEMP_BOUNDARY) {
            currentStep = `Batch almost done, prepare to open OUTPUT valve at ${TARGET_TEMP} +/- 1 ºC...`
        } else if (bioreactor.highTemp <= HIGH_TEMP_BOUNDARY && bioreactor.outputValveState === ValveState.CLOSED) {
            currentStep = 'Batch done - Empty'
        } else {
            currentStep = 'Batch too hot - Empty'
        }
    } else {
        currentStep = 'Batch successful! - Empty'
    }

    return currentStep
}

/**
 * Used to determine if the UI should sound an alarm to the operator
 */
export function shouldPlayAlert(currentStep: string, previousStep: string) {
    return currentStep !== previousStep && 
            (
                currentStep === `Almost there - Prepare to STOP filling at ${TARGET_FILL} +/- 2...` ||
                currentStep === `Batch almost done, prepare to open OUTPUT valve at ${TARGET_TEMP} +/- 1 ºC...`
            )
}

/**
 * Used to determine what status message to show the operator as it relates to the input and output valves
 */
export function getCurrentValveStatusMessage(bioreactor: Bioreactor) {
    let state = 'Waiting for input'
    if (bioreactor.inputValveState === ValveState.OPEN && bioreactor.outputValveState === ValveState.OPEN) {
        state = 'Both Filling and Emptying...'
    } else if (bioreactor.inputValveState === ValveState.OPEN) {
        state = 'Filling'
    } else if (bioreactor.outputValveState === ValveState.OPEN) {
        state = 'Emptying'
    }
    return state
}