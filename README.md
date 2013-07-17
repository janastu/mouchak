Mouchak
=======

A Javascript framework for building websites quickly.

It aims to provide a visual editing interface to create a website and edit its
content, primarily for non-technical users.

Under the hood, Mouchak abstracts the content of the website into a JSON
structure and uses Backbone model and views to render them dynamically.
This makes the site entirely run on the client side and syncs with the server
whenever there is a update.
This also makes Mouchak quite extensible. The built-in types to represent HTML
elements and media and such can be used and extended to build more custom
types.

Mouchak can also load external JS/CSS files. Any magic that can be done using
Javascript and CSS can be easily integrated into Mouchak. Just specify Mouchak
the plugin to load and the callback to execute.

Additionally, Mouchak can also provide a semantic rich environment. It provides
the user to specify tags or keywords with each associated content. To
complement it, Mouchak provides an API (filterTags) to get all the related
content together. One can easily built a view if this kind of functionality is
necessary.


How to use it
=============

Installing
----------
Either download this codebase or git clone the repo.

**Pre-requisites**

You need to have Python, MongoDB, Flask and PyMongo.
To install python and mongodb on your platform, please use search engines to
find instructions. As they are quite popular softwares, getting help online
should not be difficult.

To install Flask and PyMongo -
> pip install flask pymongo

Configuring
-----------
Configuration of Mouchak consists of configuring which database to use,
hostname, port no, title of the website etc.
Open up mouchak.conf, edit the file according to your needs, and then save it.
Ideally, you should set up seperate db for every project.

Running
-------
Once you have installed all the dependencies, go to the directory where the
code is located and type:
> python server.py

This starts the Mouchak server. You can now point your browser to
[http://localhost:5000](http://localhost:5000)

This will load up and display the website.
To edit the website go to [/edit](http://localhost:5000/edit)


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

Mouchak provides a very simple and easy to use editor to edit the JSON.

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


Support
=======

Email to rayanon at servelots dot com / arvind at servelots dot com for any kind of feedback.


Issues
======

Report issues [here](http://trac.pantoto.org/mouchak/)
First, check if your issue is already submitted by anyone else, by clicking on
"View Tickets".
If your issue is not reported, you can report it by clicking on "New Ticket".

