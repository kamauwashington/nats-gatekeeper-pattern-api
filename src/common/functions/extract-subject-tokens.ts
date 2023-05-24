// This function extracts token of a NATS Subject. Given 'us.east.mytoken' the return value would be ['us','east','mytoken']
export function extractSubjectTokens(input : string | undefined) : string[] | undefined {
    // code defensively fail fast if undefined or empty
    if (!input || /^\s+$/.test(input)) return undefined;

    // code defensively remove all spaces from input
    const workingInput : string = input.replace(/\s+/,'');

    // return tokens by splitting the workingInput by NATS delimeter "."
    return workingInput.split('.');
}