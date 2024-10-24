import { FC } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useMutation } from 'urql';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { graphql } from '@/gql';
import {
  DocumentCollectionOperation,
  useCollections,
} from '@/lib/hooks/laboratory/use-collections';
import { useEditorContext } from '@graphiql/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from '@tanstack/react-router';

const CreateOperationMutation = graphql(`
  mutation CreateOperation(
    $selector: TargetSelectorInput!
    $input: CreateDocumentCollectionOperationInput!
  ) {
    createOperationInDocumentCollection(selector: $selector, input: $input) {
      error {
        message
      }
      ok {
        operation {
          id
          name
        }
        updatedTarget {
          id
          documentCollections {
            edges {
              cursor
              node {
                id
                operations {
                  edges {
                    node {
                      id
                    }
                    cursor
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);

export type CreateOperationMutationType = typeof CreateOperationMutation;

const createOperationModalFormSchema = z.object({
  name: z
    .string({
      required_error: 'Operation name is required',
    })
    .min(3, {
      message: 'Operation name must be at least 3 characters long',
    })
    .max(50, {
      message: 'Operation name must be less than 50 characters long',
    }),
  collectionId: z.string({
    required_error: 'Collection is required',
  }),
});

export type CreateOperationModalFormValues = z.infer<typeof createOperationModalFormSchema>;

export const CreateOperationModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (args: { id: string; name: string }) => void;
}> = ({ isOpen, onClose, onSaveSuccess }) => {
  const { toast } = useToast();
  const [, mutateCreate] = useMutation(CreateOperationMutation);

  const { organizationSlug, projectSlug, targetSlug } = useParams({
    from: '/authenticated/$organizationSlug/$projectSlug/$targetSlug',
  });

  const { collections, fetching } = useCollections({
    organizationSlug,
    projectSlug,
    targetSlug,
  });
  const { queryEditor, variableEditor, headerEditor } = useEditorContext({
    nonNull: true,
  });

  const form = useForm<CreateOperationModalFormValues>({
    mode: 'onChange',
    resolver: zodResolver(createOperationModalFormSchema),
    defaultValues: {
      name: '',
      collectionId: '',
    },
    disabled: fetching,
  });

  async function onSubmit(values: CreateOperationModalFormValues) {
    const result = await mutateCreate({
      selector: {
        targetSlug,
        organizationSlug,
        projectSlug,
      },
      input: {
        name: values.name,
        collectionId: values.collectionId,
        query: queryEditor?.getValue() ?? '',
        variables: variableEditor?.getValue(),
        headers: headerEditor?.getValue(),
      },
    });
    const error = result.error || result.data?.createOperationInDocumentCollection.error;

    if (error) {
      toast({
        title: 'Failed to create operation',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const operation = result?.data?.createOperationInDocumentCollection.ok?.operation;
      if (operation) {
        onSaveSuccess({ id: operation.id, name: operation.name });
      }
      form.reset();
      onClose();
      toast({
        title: 'Operation created',
        description: `Operation "${values.name}" added to collection "${collections.find(c => c.id === values.collectionId)?.name}"`,
      });
    }
  }

  return (
    <CreateOperationModalContent
      onClose={onClose}
      onSubmit={onSubmit}
      isOpen={isOpen}
      fetching={fetching}
      form={form}
      collections={collections}
    />
  );
};

export const CreateOperationModalContent: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateOperationModalFormValues) => void;
  form: UseFormReturn<CreateOperationModalFormValues>;
  fetching: boolean;
  collections: DocumentCollectionOperation[];
}> = ({ isOpen, onClose, form, fetching, onSubmit, collections }) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        onClose();
        form.reset();
      }}
    >
      <DialogContent className="container w-4/5 max-w-[600px] md:w-3/5">
        {!fetching && (
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Create Operation</DialogTitle>
                <DialogDescription>
                  Create a new operation and add it to a collection
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operation Name</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          {...field}
                          placeholder="Your Operation Name"
                          data-cy="operation-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="collectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Which collection would you like to save this operation to?
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-cy="collections-select">
                            {collections.find(c => c.id === field.value)?.name ??
                              'Select a Collection'}
                          </SelectTrigger>
                          <SelectContent className="w-[--radix-select-trigger-width]">
                            {collections.map(c => (
                              <SelectItem key={c.id} value={c.id} data-cy="collections-select-item">
                                {c.name}
                                <div className="mt-1 line-clamp-1 text-xs opacity-50">
                                  {c.description}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  size="lg"
                  className="w-full justify-center"
                  onClick={event => {
                    event.preventDefault();
                    onClose();
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full justify-center"
                  variant="primary"
                  disabled={
                    form.formState.isSubmitting ||
                    !form.formState.isValid ||
                    !form.getValues('collectionId')
                  }
                  data-cy="confirm"
                >
                  Add Operation
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
