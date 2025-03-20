export function alreadyDeclaredError(name) {
    // "Buster" is short for "Buster Brown."
    return `Whoa buster, I think I've seen this ${name} thing before.`
}

export function notDeclaredError(name) {
    // Currently holding the absolute shit out of our horses.
    return `Hold your horses, pal! I'm not sure what yer talking bout with this ${name} thing.`;
}

export function notNumericError() {
    return `We were expectin' a handful!`;
}

export function notNumericOrStringError() {
    return `We were expectin' a handful or chitchat!`;
}

export function notBooleanError() {
    return `We were expectin' an ol' switcheroo!`;
}

export function notArrayError() {
    return `We were expectin' a todo!`;
}

export function notMapError() {
    return `We were expectin' an almanac!`;
}

export function notCollectionTypeError() {
    return `We were expectin' a todo or an almanac!`;
}

export function notClassError() {
    return `We were expectin' a doohickey!`;
}

export function twoDifferentTypesError() {
    return `Hey, these are two different types of thingamabobs!`;
}

export function manyDifferentTypesError() {
    return `Hey, some of these whatchamacallits are different types of thingamajigs!`;
}

export function noTypeError() {
    return `This little doodad doesn't have a type!`;
}

export function notAssignableError(source, target) {
    return `You can't make a ${source} into a ${target}, dontcha know.`;
}

export function notMutableError(name) {
    return `Hey now, don't go trying to change ${name}.`;
}

export function memberNotDeclaredError(name) {
    return `I can't find any sorta ${name} in here that doohickey!`;
}

export function methodNotDeclaredError(name) {
    return `I can't find any sorta ${name} in here that doohickey!`;
}

export function notInLoopError() {
    return `There's no popsicle stand to blow!`;
}

export function notInFunctionError() {
    return `We can't get goin' 'cause we never even got there!`;
}

export function notCallableError() {
    return `Can't go about calling someone without a phone!`
}

export function argumentCountError(argCount, paramCount) {
    let expected;
    let received;

    if (paramCount === 0)
    {
        expected = "We weren't expecting any arguments, ";
    }
    else if (paramCount === 1)
    {
        expected = "We were looking for 1 argument, ";
    }
    else
    {
        expected = `We were looking for ${paramCount} arguments, `;
    }

    if (argCount === 0)
    {
        if (paramCount === 1)
        {
            received = "but we didn't get one!"
        }
        else
        {
            received = "but we didn't get any!";
        }
    }
    else if (argCount === 1)
    {
        if (paramCount === 0)
        {
            received = "but we still got one!";
        }
        else
        {
            received = "but we only got 1!";
        }
    }
    else
    {
        if (paramCount === 0)
        {
            received = "but we still got some!";
        }
        else if (argCount < paramCount)
        {
            received = `but we only got ${argCount}!`;
        }
        else
        {
            received = `but we got ${argCount}!`;
        }
    }

    return (expected + received);
}