<script>
import { TARGET_FILL, TARGET_TEMP } from '../services/BioreactorService'
export let bioreactor
</script>

<section>
    <header>
        <h2>Batch Report</h2>
    </header>
    <table>
        <tbody>
            <tr>
                <td>Batch outcome</td>
                <td>{bioreactor.batchOutcome}</td>
            </tr>
            <tr>
                <td>Actual Fill Level</td>
                <td>{bioreactor.maxFill.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Temperature Range</td>
                <td>{bioreactor.lowTemp.toFixed(2)} - {bioreactor.highTemp.toFixed(2)} &deg;C</td>
            </tr>
            <tr>
                <td>pH Range</td>
                <td>{bioreactor.lowpH.toFixed(2)} - {bioreactor.highpH.toFixed(2)} pH</td>
            </tr>
            <tr>
                <td>Pressure Range</td>
                <td>{bioreactor.lowPressure.toFixed(2)} - {bioreactor.highPressure.toFixed(2)} kPa</td>
            </tr>
            <tr>
                <td>Total time</td>
                <td>{bioreactor.totalTime.toFixed(2)} s</td>
            </tr>
            <tr>
                <td>CPP1 - {TARGET_FILL} +/-2% Filled</td>
                <td>{bioreactor.cpp1}</td>
            </tr>
            <tr>
                <td>CPP2 - {TARGET_TEMP} +/-1 &deg;C</td>
                <td>{bioreactor.cpp2}</td>
            </tr>
            <tr>
                <td>CPP3 - Pressure held below 200 kPa</td>
                <td>{bioreactor.cpp3}</td>
            </tr>
        </tbody>
    </table>
</section>