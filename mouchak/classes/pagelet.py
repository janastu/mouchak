# coding utf-8;

from field import Field

class Pagelet(object):
    """Docstring for Pagelet """

    def __init__(self):
        """@todo: to be defined1 """
        self.id = object.id
        self.tags = object.tags
        self.title = object.title
        self.fields = []
        self.createFields(object.fields)

    def createFields(fields):
        for i in fields:
            field = Field(fields[i])
            self.fields.append(field)
        return
        
