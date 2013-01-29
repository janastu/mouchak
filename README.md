Mouchak
=======

A Javascript framework for building single page websites or web apps.

It takes the content of the website as a JSON. The JSON file can contain
text or multimedia content(images, audio, video).

Mouchak can also load external JS/CSS files through the JSON. This gives the website to load
plugins to enhance/customize the website either through JS or CSS.


How to use it
=============

Either download this codebase or git clone the repo.

Once you have downloaded or cloned the repo, load the index.html file in your browser.
This loads the example content from example.json.

Use the index.html file as the boilerplate file of your index.html file.
Modify the code in the script tag, which loads the example.json, and change
the URL to point to your JSON file.
Remember the JSON files is loaded in the client side. Hence your JSON file should
be from the same domain where this app is loaded.
See cross-domain policies for details.

The global object for this framework is exposed as the variable M. This can be
inspected in the console.

The M.filterTags() method takes an array of strings representing the tags to filter.
It returns an array of the content objects with the matched tags.


How it works
============

It takes the content of the site in the form of JSON. The JSON should describe the content
(in terms of type like text, audio or image) and also provide the content (in case of text
the content is as it is, in case images urls are given). The JSON should also describe the
content semantically by giving it tags.
More details about the JSON format in example.json file.

The framework provides an easy way to pull up related content by just specifying the tags.

Backbone models are used to model the content. Different content has different types.
Again all types are derived from one base type.
Each model has a corresponding view as well. The views manage how the content are rendered.

Each page is made of multiple content (content objects).
Pages are also modeled in Backbone models and their view is managed via Backbone views.

The framework also use Backbone router to handle client side routing.


What it uses
============

Mouchak uses HTML5 Boilerplate and Bootstrap project as a boilerplate code for the website.
Mouchak also leverages powerful libraries like Backbone.js and Underscore.js to manage and render
content. This gives more flexibility to the content of the website.

The main code resides in js/mouchak.js. The HTML markup it uses is in index.html.

Javascript libary files are in js/lib. We use backbone.js, underscore.js and jquery in this
framework.

Boilerplate code/files:
404.html - error template
crossdomain.xml - cross-domain policies to be obeyed by the client
css/bootstrap.css - boilerplate css
css/normalize.css - boilerplate css
css/main.css - boilerplate css
humans.txt - write your own credits
img/ - directory for images
robots.txt - crawl spider rules


Support
=======

Email to rayanon at janastu dot org / arvind at janastu dot org for any kind of feedback.


Issues
======

Report issues at http://bugzilla.pantoto.org/bugzilla3/describecomponents.cgi?product=Mouchak

