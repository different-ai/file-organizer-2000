#maturity-3/5 

Last year, I joined my co-founder on one of his projects, [[Ava]]. Ava was one of the very first AI-enabled plugins for Obsidian.

> [!early picture of Ava] 
> 
>![early picture of Ava](https://user-images.githubusercontent.com/11430621/207849826-aa59103a-3e60-47ec-85bd-45076ebf8960.gif)

We stopped working on it and started to focus on [Embedbase](https://github.com/different-ai/embedbase), an AI infra project that we developed to solve the problems we encountered while building Ava. But that didn't change the fact that there was a huge appetite for AI-enhanced Obsidian. 

Now we're a year later, and plugins like [Smart Connections](https://github.com/brianpetro/obsidian-smart-connections) filled that gap. The author of SC did an amazing job pushing "Chat with your Obsidian" to some of its best level. It allows to do many things tinkerers like me love to do, such as choosing a local embedding model, and opting out of OpenAI. Many people are happy with this plugin, and rightly so.

But even after using it and talking to many users, it's becoming clear to me that people are starting to become frustrated with some of its shortcomings. But why?

The short answer: you can't sprinkle new tech and wish for the best.

Most of these "Chat with X", all use an underlying technology called "embeddings". Embeddings make it easy to retrieve unstructured information, while GPT makes it easy to interpret unstructured information.
Embeddings made it easy for people to build search engines[^1], and adding ChatGPT in the mix allowed people to build "Chat with X" experiences. 

And to developers, each new tool is like a [[law of the instrument | hammer that makes everything look like a nail]].

Next-gen searchable systems have actually less to do with retrieving the right information, and more to do with *how* *and when* to display the information that would help the user achieve their goal. It's a UX issue.

So how can we think better about where to go next?

I think of it using two current trends:
- Rise of [Actions](https://platform.openai.com/docs/actions/introduction_-based) (and what I call [[action-based programming]])
- Adoption of multi-modal AI

To explore these topics, I started working on [File Organizer 2000](https://github.com/different-ai/file-organizer-2000). Today, it's an Obsidian plugin focused on helping people stay organized. I've revisited all assumptions I had made in the past from the ground up. And the first thing that is different about FO2000, is when you use it. Which is *never*. **It works closer to Dropbox than to a CLI.**


> [!A typical day using File Organizer 2000] 
> 
> ![[Screenshot 2024-02-04 at 15.45.11.png | Image depicting typical work day with FO2000]]

It runs in the background, analyzing changes you made to your files and trying to connect your work with existing knowledge it, renames, tags, and links notes - all on its own. 

But, with the rise of multimodal AI, I also wanted to explore going beyond just text, it handles images, and sounds as well. 

> [!Multimodal AI + Obsidian: Annotate any picture automatically] 
> 
> ![[trim.79FB2D4A-E43C-4580-9716-EFE94038898A.gif]]


The fact that it runs automatically places AI not at the edge of Obsidian, but at the center of it.

Now my exploration is taking me to what some people call Software 3.0. In its current form, FO2000 still limits you to use the program as I intended it to be used. You can't extend it and adapt it to your specific workflow. That's where [[action-based programming]] comes in. I'm exploring how you can use simple english sentences to define how you work and have the plugin automatically follow these instructions. 


> [!Software 3.0: Using plain english to program your workflows] 
> 
> ![[Screenshot 2024-02-11 at 15.01.07 1.png]]

But that is also just an intermediary step to something much more exciting. 

To truly bring AI to the center of your organization workflow, you can't make it about automating your existing behavior or even using english to do so. You need to start looking ahead, literally[^2]. You need to have the AI spot patterns for you, suggest improvements, ask you to automate recurring patterns. You need to build an AI that works as real adaptive systems, not as a drop in replacement Zapier or a Chat with your Obsidian feature.

Let's see where this lead us, but I've never been more excited to work on computer software.




- #product-knowledge
- #thoughts
- #ava
- #obsidian
- #plugin
- #software-development
- #technology
- #ai
- #integration
- #pivoting
- #co-founder
- #exploration

---

[^1]: People started applying this technology in an attempt to replace incumbents (e.g. perplexity -> google). We were looking at how to leverage this for personal knowledge base (others, like mem.io, were having their eyes on notion.)
[^2]: You can already look at products like [Rabbit and their "Large Action Model" ](https://www.rabbit.tech/research)for a glimpse of this.