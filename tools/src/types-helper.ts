import { Import, ImportName, Option } from './metadata-model';

export interface FileImport {
    path: string;
    importString: string;
}

export function buildImports(imports: Import[]): FileImport[] {

    const importsByPath = imports.reduce(
        (s, {Path, Name, Alias}) => {
            if(!s[Path])
                s[Path] = {};

            s[Path][`${Name}+${Alias}`] = { Name, Alias };

            return s;
        }, {} as Record<string, Record<string, ImportName>>
    );

    return Object.keys(importsByPath)
        .map(path => {
            const {defaultImport, names} = extractDefaultImport(getValues(importsByPath[path]));
            const importParts = [];

            if(defaultImport)
                importParts.push(defaultImport);

            if(names.length)
                importParts.push(`{ ${names.map(({Name, Alias}) => Alias ? `${Name} as ${Alias}` : Name).join(", ")} }`)

            return {
                path: `devextreme/${path}`,
                importString: importParts.join(", ")
            } as FileImport;
        })
        .sort((a, b) => a.path.localeCompare(b.path));
}

export function extractImports(options: Option[]): Import[] {
    if(!options || !options.length)
        return [];

    return options.reduce(
        (s, e) => {
            s.push(...e.TypeImports);
            s.push(...extractImports(getValues(e.Options)));
            return s;
        }, [] as Import[]
    );
}

function extractDefaultImport(imports: ImportName[]): { defaultImport?: string; names: ImportName[] } {
    const result: ReturnType<typeof extractDefaultImport> = { defaultImport: undefined, names: [] };

    for(const i of imports) {

        if(i.Name.toLowerCase() === "default") {
            result.defaultImport = i.Alias;

            if(!i.Alias)
                throw new Error("default export must have an alias: " + JSON.stringify(i));
        } else {
            result.names.push(i);
        }
    }

    return result;
}

export function getValues<T>(obj: Record<string, T>) {
    return obj ? Object.keys(obj).map(k => obj[k]) : undefined;
}
