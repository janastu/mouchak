from pymongo.son_manipulator import SONManipulator


class ObjectIdCleaner(SONManipulator):
    def transform_outgoing(self, son, collection):
        """Change the _id to be a string instance"""
        if '_id' in son:
            son['id'] = str(son['_id'])
            del(son['_id'])
        if 'date' in son and son['date'] == '':
            son['date'] = "1970-01-01"
        if 'date' in son and son['date'].find('/') > 0:
            son['date'] = son['date'].replace('/', '-')
        return son
