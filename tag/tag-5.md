---
layout: default
---

{% assign tag = "tag 5" %}
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

{% assign sorted_posts = tagged_posts | sort: 'date' | reverse %}
{% for post in sorted_posts %}
  <li class = "all-post-item">
    <div class="post-meta">
      <time class="all-post-time" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%d-%m-%Y" }}</time>
    </div>
    <div class="post-content">
      <a class="all-post-item-title" href="{{ post.url }}">{{ post.title }}</a>
      <p class="all-post-description">{{ post.description | strip_html | truncatewords: 50, "..." }}</p>
    </div>
  </li>
{% endfor %}

</ul>
</section>

<p>dang</p>

