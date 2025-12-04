#!/usr/bin/env python3
# Right To Be Wrong rule enforcement
# Nodes must call `check_r2bw` before responding

def check_r2bw(user_input):
    # Always allow humans to be wrong; this function returns True if response may proceed
    # Here we can enforce filters; currently always returns True but logs the request
    # In future, attach to a policy engine
    print('[R2BW] enforcement check for input length', len(user_input or ''))
    return True

if __name__ == '__main__':
    print(check_r2bw('test'))
