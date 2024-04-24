---
layout: default
---

{% assign tag = "econonomic analysis" %}
{% assign tagged_posts = "" | split: "" %}
{% assign collections = 'posts,building,writing,notes,misc' | split: ',' %}

{% for collection_name in collections %}
  {% assign current_collection = site[collection_name] %}
  {% for post in current_collection %}
    {% if post.tags contains tag %}
      {% assign tagged_posts = tagged_posts | push: post %}
    {% endif %}
  {% endfor %}
{% endfor %}


{% assign page.title = tag %}

<head>
  <title>{{ tag | downcase }} / thomasprada</title>
</head>



<h1>{{ tag }}</h1>
 
<section class="posts">

<ul class ="posts-ul">


<p>{{ tagged_posts.size }} {{tag}} entr{% if tagged_posts.size != 1 %}ies{% else %}y{% endif %}</p>

{% for post in tagged_posts %}
  <li class = "all-post-item">
    <a class="all-post-item-title" href="{{ post.url }}">{{ post.title }}</a>
    <time class="all-post-time" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%d-%m-%Y" }}</time>
  </li>
{% endfor %}

</ul>
</section>


