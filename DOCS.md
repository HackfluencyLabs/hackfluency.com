Skip to content
mololab
json-translator
Repository navigation
Code
Issues
22
 (22)
Pull requests
3
 (3)
Agents
Actions
Projects
Security
Insights
Owner avatar
json-translator
Public
mololab/json-translator
Go to file
t
Name		
ParvinEyvazov
ParvinEyvazov
llama-cpp languages added
749e602
 · 
5 months ago
.github
remove linter
5 months ago
bin
fix: target bug on cli options
3 years ago
docs
chore: update readme & docs/languages
2 years ago
src
llama-cpp languages added
5 months ago
test
Add caching mechanism to translation process (#86)
5 months ago
.gitignore
library reinitialized by tsdx & github action for npm added [in disable]
5 years ago
LICENSE
library reinitialized by tsdx & github action for npm added [in disable]
5 years ago
README.md
feat: Local llama.cpp support (#89)
5 months ago
jest.config.js
fix: axios ES Module on tests fix
4 years ago
makefile
fix: invalid outpout filename fixed
3 years ago
package.json
llama-cpp languages added
5 months ago
rollup.config.js
feat: add proxy list for change agent to bypass google "TooManyReques…
4 years ago
tsconfig.json
fix: show version of package on CLI dynamically from package.json
4 years ago
yarn.lock
Add caching mechanism to translation process (#86)
5 months ago
Repository files navigation
README
MIT license
support Buy Me A Coffee
Contact with me on Twitter to advertise your project on jsontt cli
✨ Sponsored by fotogram.ai - Transform Your Selfies into Masterpieces with AI ✨

✨ https://fotogram.ai ✨

jsontt logo

🚀 AI / FREE JSON & YAML TRANSLATOR 🆓

npm downloads
version minified size minzipped size

This package will provide you to translate your JSON/YAML files or JSON objects into different languages FREE.

-----------------------------------------------------

🥷 CLI Support:
Translation Module	Support	FREE
Google Translate	✅	✅ FREE
Google Translate 2	✅	✅ FREE
Microsoft Bing Translate	✅	✅ FREE
Libre Translate	✅	✅ FREE
Argos Translate	✅	✅ FREE
DeepL Translate	✅	require API KEY (DEEPL_API_KEY as env)
optional API URL (DEEPL_API_URL as env)
gpt-4o	✅	require API KEY (OPENAI_API_KEY as env)
gpt-3.5-turbo	✅	require API KEY (OPENAI_API_KEY as env)
gpt-4	✅	require API KEY (OPENAI_API_KEY as env)
gpt-4o-mini	✅	require API KEY (OPENAI_API_KEY as env)
gpt-5	✅	require API KEY (OPENAI_API_KEY as env)
gpt-5-nano	✅	require API KEY (OPENAI_API_KEY as env)
gpt-5-mini	✅	require API KEY (OPENAI_API_KEY as env)
gemma-7b	✅	require API KEY (GROQ_API_KEY as env)
gemma2-9b	✅	require API KEY (GROQ_API_KEY as env)
mixtral-8x7b	✅	require API KEY (GROQ_API_KEY as env)
llama3-8b	✅	require API KEY (GROQ_API_KEY as env)
llama3-70b	✅	require API KEY (GROQ_API_KEY as env)
llama-cpp	✅	✅ FREE
⏳ Package Support:
Translation Module	Support	FREE
Google Translate	✅	✅ FREE
Google Translate 2	✅	✅ FREE
Microsoft Bing Translate	✅	✅ FREE
Libre Translate	✅	✅ FREE
Argos Translate	✅	✅ FREE
DeepL Translate	✅	require API KEY (DEEPL_API_KEY as env)
optional API URL (DEEPL_API_URL as env)
gpt-4o	✅	require API KEY (OPENAI_API_KEY as env)
gpt-3.5-turbo	✅	require API KEY (OPENAI_API_KEY as env)
gpt-4	✅	require API KEY (OPENAI_API_KEY as env)
gpt-4o-mini	✅	require API KEY (OPENAI_API_KEY as env)
gpt-5	✅	require API KEY (OPENAI_API_KEY as env)
gpt-5-nano	✅	require API KEY (OPENAI_API_KEY as env)
gpt-5-mini	✅	require API KEY (OPENAI_API_KEY as env)
gemma-7b	✅	require API KEY (GROQ_API_KEY as env)
gemma2-9b	✅	require API KEY (GROQ_API_KEY as env)
mixtral-8x7b	✅	require API KEY (GROQ_API_KEY as env)
llama3-8b	✅	require API KEY (GROQ_API_KEY as env)
llama3-70b	✅	require API KEY (GROQ_API_KEY as env)
llama-cpp	✅	✅ FREE
Browser support will come soon...

Supported languages

✅ Install
npm i @parvineyvazov/json-translator
OR you can install it globally (in case of using CLI)
npm i -g @parvineyvazov/json-translator
-----------------------------------------------------

1. 💫 CLI Usage
jsontt <your/path/to/file.json>
or
jsontt <your/path/to/file.yaml/yml>
How to use it? (video below)
how to use jsontt

Arguments
[path]: Required JSON/YAML file path <your/path/to/file.json>
[path]: optional proxy list txt file path <your/path/to/proxy_list.txt>
Options
  -V, --version                     output the version number
  -m, --module <Module>             specify translation module
  -f, --from <Language>             from language
  -t, --to <Languages...>           to translates
  -n, --name <string>               optional ↵ | output filename
  -fb, --fallback <string>          optional ↵ | fallback logic,
                                    try other translation modules on fail | yes, no | default: no
  -cl, --concurrencylimit <number>  optional ↵ | set max concurrency limit
                                    (higher faster, but easy to get banned) | default: 3
  -c, --cache                       optional ↵ | enabled cache | default: no
  -h, --help                        display help for command
Examples
Translate a JSON file using Google Translate:

jsontt <your/path/to/file.json> --module google --from en --to ar fr zh-CN
with output name
jsontt <your/path/to/file.json> --module google --from en --to ar fr zh-CN --name myFiles
with fallback logic (try other possible translation modules on fail)
jsontt <your/path/to/file.json> --module google --from en --to ar fr zh-CN --name myFiles --fallback yes
set concurrency limit (higher faster, but easy to get banned | default: 3)
jsontt <your/path/to/file.json> --module google --from en --to ar fr zh-CN --name myFiles --fallback yes --concurrencylimit 10
other usage examples
translate (json/yaml)
jsontt file.json
jsontt folder/file.json
jsontt "folder\file.json"
jsontt "C:\folder1\folder\en.json"
with proxy (only Google Translate module)
jsontt file.json proxy.txt
Result will be in the same folder as the original JSON/YAML file.


help
jsontt -h
jsontt --help
-----------------------------------------------------

2. 💥 Package Usage
1. Translate a word | sentence
Import the library to your code.
For JavaScript

const translator = require('@parvineyvazov/json-translator');
For TypeScript:

import * as translator from '@parvineyvazov/json-translator';
// Let`s translate `Home sweet home!` string from English to Chinese

const my_str = await translator.translateWord(
  'Home sweet home!',
  translator.languages.English,
  translator.languages.Chinese_Simplified
);

// my_str: 家，甜蜜的家！
2. Translate JSON object (supports deep objects)
Import the library to your code
For JavaScript

const translator = require('@parvineyvazov/json-translator');
For TypeScript:

import * as translator from '@parvineyvazov/json-translator';
/*
Let`s translate our deep object from English to Spanish
*/

const en_lang: translator.translatedObject = {
  login: {
    title: 'Login {{name}}',
    email: 'Please, enter your email',
    failure: 'Failed',
  },
  homepage: {
    welcoming: 'Welcome!',
    title: 'Live long, live healthily!',
  },
  profile: {
    edit_screen: {
      edit: 'Edit your informations',
      edit_age: 'Edit your age',
      number_editor: [
        {
          title: 'Edit number 1',
          button: 'Edit 1',
        },
        {
          title: 'Edit number 2',
          button: 'Edit 2',
        },
      ],
    },
  },
};

/*
FOR JavaScript don`t use translator.translatedObject (No need to remark its type)
*/

let es_lang = await translator.translateObject(
  en_lang,
  translator.languages.English,
  translator.languages.Spanish
);
/*
es_lang:
            {
              "login": {
                "title": "Acceso {{name}}",
                "email": "Por favor introduzca su correo electrónico",
                "failure": "Fallida"
              },
              "homepage": {
                "welcoming": "¡Bienvenidas!",
                "title": "¡Vive mucho tiempo, vivo saludable!"
              },
              "profile": {
                "edit_screen": {
                  "edit": "Edita tus informaciones",
                  "edit_age": "Editar tu edad",
                  "number_editor": [
                    {
                      "title": "Editar número 1",
                      "button": "Editar 1"
                    },
                    {
                      "title": "Editar número 2",
                      "button": "Editar 2"
                    }
                  ]
                }
              }
            }
*/
3. Translate JSON object into Multiple languages (supports deep objects)
Import the library to your code
For JavaScript

const translator = require('@parvineyvazov/json-translator');
For TypeScript:

import * as translator from '@parvineyvazov/json-translator';
/*
Let`s translate our object from English to French, Georgian and Japanese in the same time:
*/

const en_lang: translator.translatedObject = {
  login: {
    title: 'Login',
    email: 'Please, enter your email',
    failure: 'Failed',
  },
  edit_screen: {
    edit: 'Edit your informations',
    number_editor: [
      {
        title: 'Edit number 1',
        button: 'Edit 1',
      },
    ],
  },
};

/*
FOR JavaScript don`t use translator.translatedObject (No need to remark its type)
*/

const [french, georgian, japanese] = (await translator.translateObject(
  en_lang,
  translator.languages.Automatic,
  [
    translator.languages.French,
    translator.languages.Georgian,
    translator.languages.Japanese,
  ]
)) as Array<translator.translatedObject>; // FOR JAVASCRIPT YOU DO NOT NEED TO SPECIFY THE TYPE
/*
french:
{
  "login": {
    "title": "Connexion",
    "email": "S'il vous plaît, entrez votre email",
    "failure": "Manquée"
  },
  "edit_screen": {
    "edit": "Modifier vos informations",
    "number_editor": [
      {
        "title": "Modifier le numéro 1",
        "button": "Éditer 1"
      }
    ]
  }
}

georgian:
{
  "login": {
    "title": "Შესვლა",
    "email": "გთხოვთ, შეიყვანეთ თქვენი ელ",
    "failure": "მცდელობა"
  },
  "edit_screen": {
    "edit": "თქვენი ინფორმაციათა რედაქტირება",
    "number_editor": [
      {
        "title": "რედაქტირების ნომერი 1",
        "button": "რედაქტირება 1"
      }
    ]
  }
}

japanese:
{
  "login": {
    "title": "ログイン",
    "email": "あなたのメールアドレスを入力してください",
    "failure": "失敗した"
  },
  "edit_screen": {
    "edit": "あなたの情報を編集します",
    "number_editor": [
      {
        "title": "番号1を編集します",
        "button": "編集1を編集します"
      }
    ]
  }
}
*/
4. Translate JSON file (supports deep objects)
Import the library to your code.
For JavaScript

const translator = require('@parvineyvazov/json-translator');
For TypeScript:

import * as translator from '@parvineyvazov/json-translator';
/*
Let`s translate our json file into another language and save it into the same folder of en.json
*/

let path = 'C:/files/en.json'; // PATH OF YOUR JSON FILE (includes file name)

await translator.translateFile(path, translator.languages.English, [
  translator.languages.German,
]);
── files
   ├── en.json
   └── de.json
5. Translate JSON file into Multiple languages (supports deep objects)
Import the library to your code.
For JavaScript

const translator = require('@parvineyvazov/json-translator');
For TypeScript:

import * as translator from '@parvineyvazov/json-translator';
/*
Let`s translate our json file into multiple languages and save them into the same folder of en.json
*/

let path = 'C:/files/en.json'; // PATH OF YOUR JSON FILE (includes file name)

await translator.translateFile(path, translator.languages.English, [
  translator.languages.Cebuano,
  translator.languages.French,
  translator.languages.German,
  translator.languages.Hungarian,
  translator.languages.Japanese,
]);
── files
   ├── en.json
   ├── ceb.json
   ├── fr.json
   ├── de.json
   ├── hu.json
   └── ja.json
6. Ignore words
To ignore words on translation use {{word}} OR {word} style on your object.

{
  "one": "Welcome {{name}}",
  "two": "Welcome {name}",
  "three": "I am {name} {{surname}}"
}

...translating to spanish

{
  "one": "Bienvenido {{name}}",
  "two": "Bienvenido {name}",
  "three": "Soy {name} {{surname}}"
}
jsontt also ignores the URL in the text which means sometimes translations ruin the URL in the given string while translating that string. It prevents such cases by ignoring URLs in the string while translating.

You don't especially need to do anything for it, it ignores them automatically.
{
  "text": "this is a puppy https://shorturl.at/lvPY5"
}

...translating to german

{
  "text": "das ist ein welpe https://shorturl.at/lvPY5"
}
-----------------------------------------------------

How to contribute?
Clone it
git clone https://github.com/mololab/json-translator.git
Install dependencies (with using yarn - install yarn if you don't have)
yarn
Show the magic:

Update CLI

Go to file src/cli/cli.ts

Update translation

Go to file src/modules/functions.ts

Update JSON operations(deep dive, send translation request)

Go to file src/core/json_object.ts

Update JSON file read/write operations

Go to file src/core/json_file.ts

Update ignoring values in translation (map/unmap)

Go to file src/core/ignorer.ts

Check CLI locally

For checking CLI locally we need to link the package using npm

npm link
Or you can run the whole steps using make

make run-only-cli
Make sure your terminal has admin access while running these commands to prevent any access issues.

-----------------------------------------------------

🏞 Roadmap🏁
✔️ Translate a word | sentence


for JSON objects
✔️ Translate JSON object

✔️ Translate deep JSON object

✔️ Multi language translate for JSON object

 Translate JSON object with extracting OR filtering some of its fields

for JSON files
✔️ Translate JSON file

✔️ Translate deep JSON file

✔️ Multi language translate for JSON file

 Translate JSON file with extracting OR filtering some of its fields

General
✔️ CLI support

✔️ Safe translation (Checking undefined, long, or empty values)

✔️ Queue support for big translations

✔️ Informing the user about the translation process (number of completed ones, the total number of lines and etc.)

✔️ Ignore value words in translation (such as ignore {{name}} OR {name} on translation)

✔️ Libre Translate option (CLI)

✔️ Argos Translate option (CLI)

✔️ Bing Translate option (CLI)

✔️ Ignore URL translation on given string

✔️ CLI options for languages & source selection

✔️ Define output file names on CLI (optional command for CLI)

✔️ YAML file Translate

✔️ Fallback Translation (try new module on fail)

✔️ Can set the concurrency limit manually

 Libre Translate option (in code package)

 Argos Translate option (in code package)

 Bing Translate option (in code package)

 Openrouter Translate module

 Cohere Translate module

 Anthropic/Claude Translate module

 Together AI Translate module

 llamacpp Translate module

 Google Gemini API Translate module

 Groq support - Full list as new Translate modules

✔️ ChatGPT support

 Sync translation

 Browser support

 Translation Option for own LibreTranslate instance

 Make "--" dynamically adjustable (placeholder of not translated ones).

 Update name -> prefix in CLI / Ability to pass empty to prefix in CLI (better for autonomous tasks)

 --prettyPrint to CLI which will print json in a pretty way

License
@parvineyvazov/json-translator will be available under the MIT license.

Back To Top

About
jsontt 💡 - AI JSON Translator with GPT / Gemma / Mixtral / llama + other FREE translation modules to translate your json/yaml files into other languages ✅ Check Readme ✌ Supports GPT / Gemma / Mixtral / llama / DeepL / Google / Bing / Libre / Argos

www.npmjs.com/package/@parvineyvazov/json-translator
Topics
nodejs javascript i18n language cli json typescript translation ai translate gpt bing-translate google-translate-api translate-api json-translate free-json-translate
Resources
 Readme
License
 MIT license
 Activity
 Custom properties
Stars
 600 stars
Watchers
 10 watching
Forks
 79 forks
Report repository
Releases 20
v4.0.0 ⭐ Caching Mechanism & New GPT 5 Models
Latest
on Sep 11, 2025
+ 19 releases
Sponsor this project
buy_me_a_coffee
buymeacoffee.com/parvineyvazov
Packages
No packages published
Contributors
15
@ParvinEyvazov
@Myshkouski
@fadkeabhi
@zoobzio
@tomasen
@nikitok
@rrmdn
@olegshulyakov
@abolfazlakbarzadeh
@FathiGuemri
@javix64
@x-TheFox
@JanumalaAkhilendra
@k0msenapati
@Smoothengineer
Languages
TypeScript
99.4%
 
Other
0.6%
Footer
© 2026 GitHub, Inc.
Footer navigation
Terms
Privacy
Security
Status
Community
Docs
Contact
Manage cookies
Do not share my personal information
 
