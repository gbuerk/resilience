<script>
export let bioreactor
</script>

<section>
    <header>
        <h2>Current Batch Statistics</h2>
    </header>
    <table>
        <thead>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Fill %</td>
                <td>{bioreactor.fill_percent.toFixed(2)}</td>
            </tr>
            <tr>
                <td>pH</td>
                <td>{bioreactor.pH.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Pressure (kPa)</td>
                <td>{bioreactor.pressure.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Temperature (&deg;C)</td>
                <td>{bioreactor.temperature.toFixed(2)}</td>
            </tr>
        </tbody>
    </table>
</section>