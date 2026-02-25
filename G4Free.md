URL https://www.npmjs.com/package/@gpt4free/g4f.dev?activeTab=readme







skip to:contentpackage searchsign in
❤
Pro
Teams
Pricing
Documentation
npm
Search packages
Search
@gpt4free/g4f.dev
1.1.2 • Public • Published a month ago
GPT4Free Documentation Hub
Welcome to the official docs for **GPT4Free** – free and convenient AI endpoints you can use directly in your apps, scripts, and even right in your browser.
Here you’ll find a clear overview, quick examples, and entry points to deeper docs for every major feature.

Installation & Setup
For full install guides—choose your method:

Git Install
Docker
Requirements
For rapid starts, you can use either Python or JavaScript (web).

Getting Started
📝 Text Generation
Python example for chat completion (with and without web search):

from g4f.client import Client

client = Client()
response = client.chat.completions.create(
    model="gpt-4.1",  # Try "gpt-4o", "deepseek-v3", etc.
    messages=[{"role": "user", "content": "Hello"}],
    web_search=False
)
print(response.choices[0].message.content)
Output:

Hello! How can I assist you today?
🎨 Image Generation
Generate images with a single call (returns URLs or base64):

from g4f.client import Client

client = Client()
response = client.images.generate(
    model="flux",  # Other models: 'dalle-3', 'gpt-image', etc.
    prompt="a white siamese cat",
    response_format="url"
)
print(f"Generated image URL: {response.data[0].url}")
More Python client info →

and Async client →

🧙‍♂️ Using GPT4Free.js
Use the official JS client right in the browser—no backend needed.

For text generation:

<script type="module">
    import Client from 'https://g4f.dev/dist/js/client.js';

    const client = new Client();
    const result = await client.chat.completions.create({
        model: 'gpt-4.1',  // Or "gpt-4o", "deepseek-v3"
        messages: [{ role: 'user', content: 'Explain quantum computing' }]
    });
    console.log(result.choices[0].message.content);
</script>
And for image generation:

<script type="module">
    import Client from 'https://g4f.dev/dist/js/client.js';

    const client = new Client();
    const response = await client.images.generate({
        model: "flux", // Or "dalle-3", "gpt-image"
        prompt: "a white siamese cat"
    });
    const imageUrl = response.data[0].url;
    console.log(`Generated Image URL: ${imageUrl}`);
    // Example: document.body.innerHTML += `<img src="${imageUrl}" />`;
</script>
See more JS client usage →

💻 Using CLI Client
Examples

Text generation:

g4f client "Explain quantum computing in simple terms"
Image description:

g4f client image.jpg "Describe this image"
Image generation (with supported models):

g4f client -m flux -O output.jpg "A futuristic cityscape"
CLI Client documentation →

Deep Dives
API endpoints and usage *new
Available Providers & Models
Selecting a Provider
Provider Documentation
API docs (full spec)
File API Documentation (Files and Documents)
Media Documentation (Audio, Image and Video)
Vision Support (Image Upload)
Image Editing & Variation
Authentication, Configuration Guide (.har and cookies)
Advanced: Create your own Provider
Integrations: LangChain, PydanticAI
GUI/WebUI, Phone, Backend API
Troubleshooting
Community & Links
Open Source: GitHub: gpt4free/g4f.dev

Contribute & Report Bugs: PRs & issues are welcome!

Project Website: https://g4f.dev/

Pollinations AI:


GitHub: pollinations/pollinations

GPT4Free and g4f.dev are continuously improving. Have fun building, and let the bots do the heavy lifting for you!

← Back to GPT4Free GitHub

Readme
Keywords
gpt4freegpt4free.jsg4fg4f.devjavascriptnpmbrowsergptchatgptopenaiaiclientsdkfreeaigpt-4gpt-4ochatapibrowseraiaijsclienttextgenerationimagegenerationin-browseraifrontendaiopenaialternativejavascriptailibrarynodejspromptengineeringchatbotaiintegration
Package Sidebar
Install
npm i @gpt4free/g4f.dev


Repository
github.com/gpt4free/g4f.dev

Homepage
github.com/gpt4free/g4f.dev#readme

Weekly Downloads
74

Version
1.1.2

License
MIT

Unpacked Size
54.2 kB

Total Files
5

Last publish
a month ago

Collaborators
hlohaus
Analyze security with SocketCheck bundle sizeView package healthExplore dependencies
Report malware
Footer
Support
Help
Advisories
Status
Contact npm
Company
About
Blog
Press
Terms & Policies
Policies
Terms of Use
Code of Conduct
Privacy
Viewing @gpt4free/g4f.dev version 1.1.2