# coding utf-8;

from pagelet import Pagelet

class Page(object):
    """Docstring for Page """

    def __init__(self):
        """@todo: to be defined1 """
        self.id = object.id
        self.tags = object.tags
        self.title = object.title
        self.slug = object.slug
        self.category = object.category
        self.pagelets = []
        self.createPagelets(object.pagelets)

    def createPagelets(pagelets):
        for i in pagelets:
            pagelet = Pagelet(pagelet[i])
            self.pagelets.append(pagelet)
        return
