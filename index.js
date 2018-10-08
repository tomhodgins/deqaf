import jsincss from 'https://unpkg.com/jsincss/index.vanilla.js'

export default function(
  plugins = {
    stylesheet: {},
    rule: {}
  }
) {

  // For each stylesheet in the CSSOM
  return Array.from(document.styleSheets).forEach(stylesheet =>

    // For each rule in the stylesheet
    Array.from(stylesheet.cssRules).forEach(rule => {

      // If JS-powered style rule
      if (rule.type === 1 && rule.selectorText.includes('--')) {

        // selector[]
        const selector = /(.*)\[--.+\]/.test(rule.selectorText)
          && rule.selectorText.match(/(.*)\[--.+\]/)[1]
          || '*'

        // [plugin]
        const plugin = rule.selectorText
          .replace(/.*\[--([^=]+).*\]/, '$1')
          .replace(/-([a-z])/g, (string, match) => match.toUpperCase())

        // If we have a rule plugin with the same name
        if (plugins.rule[plugin]) {

          // [="(args)"]
          const args = /.*\[--.+="(.*)"\]/.test(rule.selectorText)
            && rule.selectorText.match(/.*\[--.+="(.*)"\]/)[1]
            || ''

          // { declarations }
          const declarations = rule.cssText
            .substring(rule.selectorText.length)
            .trim()
            .slice(1, -1)
            .trim()

          // If rule defines custom --selector and --events properties
          if (
            Array.from(rule.style).includes('--selector')
            && Array.from(rule.style).includes('--events')
          ) {

            // Push a rule with custom events to output
            jsincss(
              () => plugins.rule[plugin](
                selector,
                args,
                declarations
              ),
              rule.style.getPropertyValue('--selector').trim(),
              rule.style.getPropertyValue('--events').trim()
            )

          } else {

            // Otherwise push a generic rule to output
            jsincss(
              () => plugins.rule[plugin](
                selector,
                args,
                declarations
              )
            )

          }

        }

      // If JS-powered @supports rule
      } else if (rule.type === 12 && rule.conditionText.includes('--')) {

        // plugin()
        const plugin = rule.conditionText
          .replace(/--([^(]+)\(.+\)/, '$1')
          .replace(/-([a-z])/g, (string, match) => match.toUpperCase())

        // If we have an at-rule plugin with the same name
        if (plugins.stylesheet[plugin]) {

          // (args)
          const args = /--[^(]+(.*)/.test(rule.conditionText)
            && JSON.parse(`[${
              rule.conditionText
                .replace(/^[^(]*\((.*)\)$/, '$1')
                .trim()
            }]`)
            || ''

          // { body }
          const body = rule.cssText
            .substring(`@supports `.length + rule.conditionText.length)
            .trim()
            .slice(1, -1)

          // If group body rule contains a top-level rule for [--options]
          // And that rule contains custom --selector and --events properties
          if (
            Array.from(rule.cssRules)
              .find(rule => rule.selectorText === '[--options]')
            && ['--selector', '--events'].every(prop =>
                Array.from(rule.cssRules)
                  .reverse()
                  .find(rule => rule.selectorText === '[--options]')
                  .style
                  .getPropertyValue(prop) !== null
            )
          ) {

            const props = Array.from(rule.cssRules)
              .reverse()
              .find(rule => rule.selectorText === '[--options]')
              .style

              // Push a stylesheet with custom events to output
              jsincss(
                () => plugins.stylesheet[plugin](
                  ...args,
                  body.trim().replace(/\n/g, '\n    ')
                ),
                props.getPropertyValue('--selector').trim(),
                props.getPropertyValue('--events').trim()
              )

          } else {

            // Otherwise push a generic stylesheet to output
            jsincss(
              () => plugins.stylesheet[plugin](
                ...args,
                body.trim().replace(/\n/g, '\n  ')
              )
            )

          }

        }

      }

    })

  )

}