# Devim Front: Prettier Plugin Group Imports

Provides a concise way to organize imports in your code.

While this is not recommended, it is also a common practice that you or your organization can ask for

This plugin is mainly designed for internal use at Devim but you are free to use it and/or contribute

## Installation

Using NPM:

```bash
npm i --save-dev @devim-front/prettier-plugin-group-imports
```

Using Yarn:

```bash
yarn add -D @devim-front/prettier-plugin-group-imports
```

Add it to your .prettierrc:

```
"plugins": ["./node_modules/@devim-front/prettier-plugin-group-imports"]
```

## Configuration

All configuration is stored in .prettierrc file. You can configure it as you like. All parameters are optional

### Resolver

Resolver checks for local imports using its contained API. There are two:

**[default]** Package Resolver

Checks if import location starts with one of dependencies listed in package.json. Your package.json must exist and be accesible to the plugin

```
"resolver": {
  "type": "package"
}
```

Filesystem resolver (slow)

Automatically resolves your import location using tsconfig.json' baseUrl and paths to absolute and check if this file exists.

You can also specify custom name for your tsconfig file to search

```
"resolver": {
  "type": "fs",
  "configName": "tsconfig.json"
}
```

### Parser options

---

**importCommentMode**

Sets how imports are moved within the source code. Specifically: which comment sections are considered relative to the provided import statement

**Default value**

`prev-line`

**Available values**

`prev-line` - Comment that is located no further than 1 line upwards is considered relative to the import

`same-line` Comment that is located on the same line as an import is considered relative
default prev-line

`none` Comments will persist their initial place

---

**importLocation**

Sets the location where are you imports will be inserted to

**Default value**

`auto`

**Available values**

`leading` - Imports will be placed starting from the first line of the source code

`auto` - Imports will be placed starting from the position of the first import encountered in your source code

---

### Groups

You can specify sorting groups with separate internal sorting algorithms. First parameter of the tuple is one of each sorting groups (global, local, relative, static or rest). If import node does not fit any of listed groups it will fall to the 'rest' group. Second parameter represent the sorting algorithm that is used within this specific group

**Available groups**

`global, local, relative, static, rest`

**Available algorithms**

`natural` - Uses natural sort

`persist` - Persists original order from the source code

**Default value**

```
[
  ['global','persist'],
  ['local','persist'],
  ['relative','persist'],
  ['static','persist'],
  ['rest','persist']
]

```

---

**splitRelativeGroups**

Splits group of relative imports to subgroups based on their deepness (true/false)

**Default value**

`true`

---

**relativeSortAlg**

Sets algorithm that is used to sort relative groups based on their deepness

**Available values**

`shallow-first` - Nearest relative imports will be put first

`deepest-first` - Deepest relative imports will be put first

**Default value**

`deepest-first`

---

## License

MIT
