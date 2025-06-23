import math
def binary(n):
    x = []
    while i>1:
        if(n % 2) == 0:
            x.append(0)
            n = n/2
            i+=1
        else:
            x.append(1)
            n = (n-1)/2
            i += 1
    return x[::-1] #reverses the list
cards = binary(25)
cards.reverse()
print(cards)
# v=[]
# # now printing all the deck cards
# for i in range(16):
#     print(binary(i))
#     c=binary(i)
#     v.append(c)
# print(v)

#finding the max cap in dim 6
#find max cap
# for i in v:
#     if()
#
