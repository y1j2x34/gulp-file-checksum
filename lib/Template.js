function escapeRegex(str) {
    return str.replace(/([\$\[\]\(\)\{\}\^\+\.\*\?\\\-])/g, '\\$1');
}

function textplain(text, variables) {
    return text;
}

function placeholder( key, variables, notFound ) {
    if (!variables) {
        return notFound !== undefined ? notFound(key) : '';
    }
    if (key in variables) {
        return variables[key];
    } else if (notFound !== undefined) {
        return notFound(key);
    }
    return '';
}

async function merge(compiled, variables, notFound) {
    if (!variables) {
        variables = {};
    }
    const partials = [];
    for(let parser of compiled) {
        const partial = await parser(variables, notFound)
        partials.push(partial);
    }
    return partials.join('');
}


class Template {
    constructor(parsed) {
        this.parsed = parsed;
    }
    execute(variables, keyNotFound) {
        return this.parsed(variables, keyNotFound);
    }
}

module.exports = class TemplateParser {
    constructor(prefix, suffix, escape) {
        const prefReg = escape ? escapeRegex(prefix) : prefix;
        const sufReg = escape ? escapeRegex(suffix) : suffix;
        this.regex = new RegExp(`${prefReg}(.*?)${sufReg}`, 'g');
    }
    parse(text) {
        if (typeof text !== 'string') {
            return merge.bind(null, []);
        }
        const compiled = [];
        let lastIndex = 0;
        while (true) {
            const result = this.regex.exec(text);
            if (result === null) {
                break;
            }
            const match = result[0];
            const key = result[1];
            const index = result.index;

            compiled.push(textplain.bind(null, text.slice(lastIndex, index)));

            compiled.push(placeholder.bind(null, key));

            lastIndex = index + match.length;
        }
        compiled.push(textplain.bind(null, text.slice(lastIndex)));
        return new Template(merge.bind(null, compiled));
    }
}