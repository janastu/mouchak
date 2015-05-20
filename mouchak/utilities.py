from pymongo.son_manipulator import SONManipulator


class ObjectIdCleaner(SONManipulator):
    def transform_outgoing(self, son, collection):
        """Change the _id to be a string instance"""
        son['id'] = str(son['_id'])
        del(son['_id'])
        return son
