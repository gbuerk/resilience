import { BioreactorService, CppResult, getCurrentStep, getCurrentValveStatusMessage, HIGH_FILL_BOUNDARY, isBatchComplete, isCpp1CurrentlyMet, isCpp2CurrentlyMet, isCpp3CurrentlyMet, LOW_FILL_BOUNDARY, shouldPlayAlert, TARGET_FILL, TARGET_TEMP, updateInternalState, ValveState, WARN_FILL_BOUNDARY } from "./BioreactorService"
global.fetch = jest.fn()
// global.console.error = jest.fn()

beforeEach(() => {
    jest.resetAllMocks()
})

describe('Bioreactor Service', () => {
    describe('createBioreactor', () => {
        it('calls the server to get a new id', async () => {
            // Arrange
            mockCreateCall()

            // Act
            const bioreactorService = BioreactorService()
            await bioreactorService.createBioreactor()
            
            // Assert
            expect(fetch).toHaveBeenCalledWith("http://mini-mes.resilience.com/bioreactor/0")
        })
        it('populates the store', async () => {
            // Arrange
            mockCreateCall()

            // Act
            const bioreactorService = BioreactorService()
            await bioreactorService.createBioreactor()
            
            // Assert
            const bioreactor = await getBioreactorFromStore(bioreactorService.bioreactorStore)
            expect(bioreactor).toEqual({
                id: "12345",
                cpp1: CppResult.FAILURE,
                cpp2: CppResult.FAILURE,
                cpp3: CppResult.SUCCESS,
                fill_percent: 0,
                highPressure: 130,
                highTemp: 20,
                highpH: 7,
                inputValveState: ValveState.CLOSED,
                lowPressure: 130,
                lowTemp: 20,
                lowpH: 7,
                maxFill: 0,
                outputValveState: ValveState.CLOSED,
                pH: 7,
                pressure: 130,
                temperature: 20
            })
        })
    })
    describe('toggleInputValve', () => {
        it('opens the input valve when closed', async () => {
            // Arrange
            mockCreateCall()
            const bioreactorService = BioreactorService()
            await bioreactorService.createBioreactor()
            
            // Act
            await bioreactorService.toggleInputValve()
            await bioreactorService.toggleInterval()

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                "http://mini-mes.resilience.com/bioreactor/12345/input-valve", 
                {
                    "body": "{\"state\":\"open\"}", 
                    "headers": {
                        "content-type": "application/json"
                    }, 
                    "method": "PUT"
                }
            )
            let bioreactor = await getBioreactorFromStore(bioreactorService.bioreactorStore)
            expect(bioreactor).toHaveProperty('inputValveState', ValveState.OPEN)

        })
        it('closes the input valve when open', async () => {
            // Arrange
            mockCreateCall()
            const bioreactorService = BioreactorService()
            await bioreactorService.createBioreactor()
            
            // Act
            await bioreactorService.toggleInputValve()
            await bioreactorService.toggleInterval()
            await bioreactorService.toggleInputValve()

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                "http://mini-mes.resilience.com/bioreactor/12345/input-valve", 
                {
                    "body": "{\"state\":\"closed\"}", 
                    "headers": {
                        "content-type": "application/json"
                    }, 
                    "method": "PUT"
                }
            )
            let bioreactor = await getBioreactorFromStore(bioreactorService.bioreactorStore)
            expect(bioreactor).toHaveProperty('inputValveState', ValveState.CLOSED)

        })
    })
    describe('toggleOutputValve', () => {
        it('opens the output valve when closed', async () => {
            // Arrange
            mockCreateCall()
            const bioreactorService = BioreactorService()
            await bioreactorService.createBioreactor()
            
            // Act
            await bioreactorService.toggleOutputValve()

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                "http://mini-mes.resilience.com/bioreactor/12345/output-valve", 
                {
                    "body": "{\"state\":\"open\"}", 
                    "headers": {
                        "content-type": "application/json"
                    }, 
                    "method": "PUT"
                }
            )
            let bioreactor = await getBioreactorFromStore(bioreactorService.bioreactorStore)
            expect(bioreactor).toHaveProperty('outputValveState', ValveState.OPEN)

        })
        it('closes the output valve when open', async () => {
            // Arrange
            mockCreateCall()
            const bioreactorService = BioreactorService()
            await bioreactorService.createBioreactor()
            
            // Act
            await bioreactorService.toggleOutputValve()
            await bioreactorService.toggleOutputValve()

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                "http://mini-mes.resilience.com/bioreactor/12345/output-valve", 
                {
                    "body": "{\"state\":\"closed\"}", 
                    "headers": {
                        "content-type": "application/json"
                    }, 
                    "method": "PUT"
                }
            )
            let bioreactor = await getBioreactorFromStore(bioreactorService.bioreactorStore)
            expect(bioreactor).toHaveProperty('outputValveState', ValveState.CLOSED)

        })
    })
    describe('updateBioreactorStats', () => {
        it ('calls the server for an update and applies it to the store', async () => {
            // Arrange
            mockCreateCall()
            const bioreactorService = BioreactorService()
            await bioreactorService.createBioreactor()
            
            // Act
            await bioreactorService.updateBioreactorStats()
    
            // Assert
            expect(fetch).toHaveBeenCalledWith("http://mini-mes.resilience.com/bioreactor/12345")
        })
    })
    describe('getCurrentStep', () => {
        it('fails if pressure is too high', () => {
            // Arrange
            const bioreactor = {
                cpp3: CppResult.FAILURE
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('Too much pressure - Empty')
        })
        it('prompts to continue filling if fill percent is below warning level', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.FAILURE,
                cpp3: CppResult.SUCCESS,
                fill_percent: 0
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('Fill to 70 +/- 2%')
        })
        it('prompts with a warning when fill level meets the warn boundary', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.FAILURE,
                cpp3: CppResult.SUCCESS,
                fill_percent: WARN_FILL_BOUNDARY
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('Almost there - Prepare to STOP filling at 70 +/- 2...')
        })
        it('prompts to stop when fill level meets the low fill boundary', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.FAILURE,
                cpp3: CppResult.SUCCESS,
                fill_percent: LOW_FILL_BOUNDARY
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('STOP filling')
        })
        it('prompts to let some out when fill level exceeds the high fill boundary', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.FAILURE,
                cpp3: CppResult.SUCCESS,
                fill_percent: HIGH_FILL_BOUNDARY + 1
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('Too full - Let some out')
        })
        it('prompts to wait for temp to rise when fill level has been met and high temp is below warn boundary', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.SUCCESS,
                cpp3: CppResult.SUCCESS,
                cpp2: CppResult.FAILURE,
                highTemp: 20
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual(`Wait for temperature to rise to ${TARGET_TEMP} +/- 1 ºC`)
        })
        it('prompts to prepare to open output valve when fill level has been met and high temp is below low boundary', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.SUCCESS,
                cpp3: CppResult.SUCCESS,
                cpp2: CppResult.FAILURE,
                highTemp: 70
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('Batch almost done, prepare to open OUTPUT valve at 80 +/- 1 ºC...')
        })
        it('prompts to open output valve when fill level has been met and high temp is above low boundary', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.SUCCESS,
                cpp3: CppResult.SUCCESS,
                cpp2: CppResult.FAILURE,
                outputValveState: ValveState.CLOSED,
                highTemp: 80
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('Batch done - Empty')
        })
        it('prompts to open output valve when fill level has been met but high temp is above high boundary', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.SUCCESS,
                cpp3: CppResult.SUCCESS,
                cpp2: CppResult.FAILURE,
                outputValveState: ValveState.CLOSED,
                highTemp: 82
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('Batch too hot - Empty')
        })
        it('prompts continue emptying when all 3 cpps have been met', () => {
            // Arrange
            const bioreactor = {
                cpp1: CppResult.SUCCESS,
                cpp3: CppResult.SUCCESS,
                cpp2: CppResult.SUCCESS,
            }

            // Act
            const result = getCurrentStep(bioreactor)

            // Assert
            expect(result).toEqual('Batch successful! - Empty')
        })
    })
    describe('shouldPlayAlert', () => {
        it('returns true when state moves to fill alert', () => {
            expect(shouldPlayAlert(`Almost there - Prepare to STOP filling at ${TARGET_FILL} +/- 2...`, '')).toEqual(true)
        })
        it('returns true when state moves to temperature alert', () => {
            expect(shouldPlayAlert(`Batch almost done, prepare to open OUTPUT valve at ${TARGET_TEMP} +/- 1 ºC...`, '')).toEqual(true)
        })
        it('returns false when stats are the same', () => {
            expect(shouldPlayAlert('', '')).toEqual(false)
        })
    })
    describe('getCurrentValveStatusMessage', () => {
        it('handles both closed', () => {
            // Arrange
            const bioreactor = {
                inputValveState: ValveState.CLOSED,
                outputValveState: ValveState.CLOSED,
            }
            
            // Act / Assert
            expect(getCurrentValveStatusMessage(bioreactor)).toBe('Waiting for input')
        })
        it('handles both open', () => {
            // Arrange
            const bioreactor = {
                inputValveState: ValveState.OPEN,
                outputValveState: ValveState.OPEN,
            }
            
            // Act / Assert
            expect(getCurrentValveStatusMessage(bioreactor)).toBe('Both Filling and Emptying...')
        })
        it('handles input open', () => {
            // Arrange
            const bioreactor = {
                inputValveState: ValveState.OPEN,
                outputValveState: ValveState.CLOSED,
            }
            
            // Act / Assert
            expect(getCurrentValveStatusMessage(bioreactor)).toBe('Filling')
        })
        it('handles output open', () => {
            // Arrange
            const bioreactor = {
                inputValveState: ValveState.CLOSED,
                outputValveState: ValveState.OPEN,
            }
            
            // Act / Assert
            expect(getCurrentValveStatusMessage(bioreactor)).toBe('Emptying')
        })
    })
    describe('isBatchComplete', () => {
        it('is false if the output valve is closed', () => {
            // Arrange
            const bioreactor = {
                outputValveState: ValveState.CLOSED,
                fill_percent: 0,
                startTimer: new Date
            }

            // Act / Assert
            expect(isBatchComplete(bioreactor)).toEqual(false)
        })
        it('is false if time has not started', () => {
            // Arrange
            const bioreactor = {
                outputValveState: ValveState.OPEN,
                fill_percent: 0,
                startTimer: undefined
            }

            // Act / Assert
            expect(isBatchComplete(bioreactor)).toEqual(false)
        })
        it('is false if fill_percent is not 0', () => {
            // Arrange
            const bioreactor = {
                outputValveState: ValveState.OPEN,
                fill_percent: 1,
                startTimer: new Date
            }

            // Act / Assert
            expect(isBatchComplete(bioreactor)).toEqual(false)
        })
        it('returns true if all conditions are met', () => {
            // Arrange
            const bioreactor = {
                outputValveState: ValveState.OPEN,
                fill_percent: 0,
                startTimer: new Date
            }

            // Act / Assert
            expect(isBatchComplete(bioreactor)).toEqual(false)
        })
    })
    describe('isCpp1CurrentlyMet', () => {
        it('returns false if input valve is open', () => {
            // Arrange
            const bioreactor = {
                inputValveState: ValveState.OPEN,
                outputValveState: ValveState.CLOSED,
                fill_percent: 70
            }

            // Act / Assert
            expect(isCpp1CurrentlyMet(bioreactor)).toEqual(false)
        })
        it('returns false if output valve is open', () => {
            // Arrange
            const bioreactor = {
                inputValveState: ValveState.CLOSED,
                outputValveState: ValveState.OPEN,
                fill_percent: 70
            }

            // Act / Assert
            expect(isCpp1CurrentlyMet(bioreactor)).toEqual(false)
        })
        it('returns false if fill percent is not in range', () => {
            // Arrange
            const bioreactor = {
                inputValveState: ValveState.CLOSED,
                outputValveState: ValveState.CLOSED,
                fill_percent: 10
            }

            // Act / Assert
            expect(isCpp1CurrentlyMet(bioreactor)).toEqual(false)
        })
        it('returns true if all conditions are met', () => {
            // Arrange
            const bioreactor = {
                inputValveState: ValveState.CLOSED,
                outputValveState: ValveState.CLOSED,
                fill_percent: 70
            }

            // Act / Assert
            expect(isCpp1CurrentlyMet(bioreactor)).toEqual(true)
        })
    })
    describe('isCpp2CurrentlyMet', () => {
        it('returns false if high temp is not in range', () => {
            // Arrange
            const bioreactor = {
                highTemp: 0
            }
    
            // Act / Assert
            expect(isCpp2CurrentlyMet(bioreactor)).toEqual(false)
        })
        it('returns true if high temp is in range', () => {
            // Arrange
            const bioreactor = {
                highTemp: 80
            }
    
            // Act / Assert
            expect(isCpp2CurrentlyMet(bioreactor)).toEqual(true)
        })
    })
    describe('isCpp3CurrentlyMet', () => {
        it('returns false if high pressure is too high', () => {
            // Arrange
            const bioreactor = {
                highPressure: 200
            }
    
            // Act / Assert
            expect(isCpp3CurrentlyMet(bioreactor)).toEqual(false)
        })
        it('returns true if high pressure is in range', () => {
            // Arrange
            const bioreactor = {
                highPressure: 199
            }
    
            // Act / Assert
            expect(isCpp3CurrentlyMet(bioreactor)).toEqual(true)
        })
    })
    describe('updateInternalState', () => {
        it('updates all variables appropriately', () => {
            // Arrange
            const bioreactor = {
                temperature: 80,
                highTemp: 0,
                lowTemp: 100,
                pressure: 100,
                lowPressure: 110,
                highPressure: 90,
                pH: 7,
                lowpH: 9,
                highpH: 6,
                fill_percent: 70,
                maxFill: 60,
                cpp1: CppResult.FAILURE,
                cpp2: CppResult.FAILURE,
                cpp3: CppResult.FAILURE,
                inputValveState: ValveState.CLOSED,
                outputValveState: ValveState.CLOSED,
            }

            // Act / Assert
            expect(updateInternalState(bioreactor)).toEqual({
                cpp1: CppResult.SUCCESS,
                cpp2: CppResult.SUCCESS,
                cpp3: CppResult.SUCCESS,
                fill_percent: 70,
                highPressure: 100,
                highTemp: 80,
                lowTemp: 80,
                highpH: 7,
                inputValveState: ValveState.CLOSED,
                lowPressure: 100,
                lowpH: 7,
                maxFill: 70,
                outputValveState: ValveState.CLOSED,
                pH: 7,
                pressure: 100,
                temperature: 80,
            })
        })
    })
})

function mockCreateCall(expectedPressure: number = 130, expectedTemp: number = 20, expectedpH: number = 7) {
    const json = jest.fn(); (global.fetch as jest.Mock).mockResolvedValue({
        json
    })
    json.mockResolvedValue({
        pressure: expectedPressure,
        temperature: expectedTemp,
        pH: expectedpH,
        fill_percent: 0,
        id: '12345',
    })
}

function getBioreactorFromStore(bioreactorStore) {
    return new Promise(resolve => {
        bioreactorStore.subscribe(bioreactor => {
            resolve(bioreactor)
        })
    })
}
