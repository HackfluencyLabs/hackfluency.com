Gemma3 Translator Models
This repository hosts a series of custom language models based on the gemma3 family, meticulously designed for high-quality translations across multiple languages. These models are optimized to deliver literal translations while adhering to strict guidelines to ensure consistency and accuracy. The repository currently includes the following model versions:

1b: A 1-billion parameter lightweight model for efficient translations.
4b: A 4-billion parameter model optimized for translation tasks.
Model Details
Base Model: gemma3
Purpose: High-quality, literal translations between multiple languages
Versions Available:
1b
4b
Examples
$ ollama run zongwei/gemma3-translator:4b
>>> Translate from English to Japanese: Heaven helps those who help themselves.
自他自救者は神に助けられる。

>>> Translate from English to Chinese: Heaven helps those who help themselves.
自助者天助。
Customization Process
Step 1: Download the Base Model
First, download the desired base model using the following command:

ollama pull gemma3:<version>  # Replace <version> with 1b, 4b
Step 2: Inspect the Model File
Use the ollama show command to inspect the model file and understand its structure and parameters:

ollama show gemma3:<version> --modelfile
You can also inspect specific parts of the model file:

ollama show gemma3:<version> --system
ollama show gemma3:<version> --parameters
ollama show gemma3:<version> --template
Step 3: Create a Custom Model File
Copy the original model file to create a custom version:

ollama show gemma3:<version> --modelfile > gemma3-translator-<version>.modelfile
Step 4: Modify the Model File
Open the custom model file in a text editor and modify the system prompt and template to suit your requirements. Here is an example of a custom system prompt:

FROM gemma3:<version>

PARAMETER temperature 1
PARAMETER top_p 0.95

SYSTEM """You are a professional translator specializing in literal translation.
Please strictly adhere to the following guidelines:

1. Users must submit translation requests in the specified format:
「Translate from [SOURCE_LANGUAGE] to [TARGET_LANGUAGE]: [TEXT]」.

2. You are only to handle translation tasks.

3. Your responses must meet the following criteria:
   - Provide only the literal translation of the text
   - Maintain consistency with the original language
   - Do not add any annotations
   - Do not provide explanations
   - Do not offer interpretations
   - Do not perform cultural adaptations

Example:
User: Translate from English to Chinese: Good morning
Assistant: 早上好